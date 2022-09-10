import React, { Fragment, useEffect, useState } from 'react'
import { Button, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { getAll, insertLog } from '../utils/db/sqliteConfig';
import { ApiService } from '../utils/api/axio-setup';
import { styles } from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = "location-tracking";
const STORAGE_CURRENT_LOCATION_KEY = 'expo-current-location';
const INTERVAL = 15000;

export const DriverTracker = () => {
    // constants
    const LATITUDE_DELTA = 0.004;
    const LONGITUDE_DELTA = 0.004;

    const { isConnected, isInternetReachable } = NetInfo.useNetInfo();
    const [hasOfflineLogs, setHasOfflineLogs] = useState<boolean>(false);
    const [started, setStarted] = useState(false);

    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [initialLocation, setInitialLocation] = useState<any>(null);

    const getInitialCurrentLocation = async () => {
        try {
            const current = await Location.getCurrentPositionAsync();
            setInitialLocation({
                latitude: current?.coords.latitude,
                longitude: current?.coords.longitude
            })
        } catch (error) {
            console.log('catched getInitialCurrentLocation error: ', error);
        }
    }

    const handleOnline = async () => {
        try {
            const current = await getSavedCurrentLocation()
            console.log('current: ', current);
            
            setCurrentLocation(current)
            if ((!isConnected || !isInternetReachable)) {
                insertLog(String(Date.now()), String(current?.longitude), String(current?.latitude));
                setHasOfflineLogs(true);
                console.log('saved to offline storage sqlite');
            } else {
                console.log('hasOfflineLogs: ', hasOfflineLogs);
                
                if (hasOfflineLogs) {
                    // handle
                    getAll();
                    setHasOfflineLogs(false);
                } else {
                    await ApiService.postRequest(
                        "/oneLocation",
                        { "lng": current?.longitude, "lat": current?.latitude });
                }
            }
        } catch (error) {
            console.log('update location error');
        }
    }

    const handleStartTracking = () => {
        setStarted(true)
        requestPermissions()

    }
    const stopTracking = async () => {
        try {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        } catch (err) {
            console.error(err);
        } finally {
            setStarted(false)
        }
    }

    useEffect(() => {
        getInitialCurrentLocation();
    }, [])


    useEffect(() => {
        console.log('started: ', started);
        let interval = setInterval(() => {
            if (started) {
                console.log('interval ran on ', new Date().toLocaleTimeString());
                handleOnline()
            } else {
                console.log('not started tracking');
            }
        }, INTERVAL)

        if (!started) {
            clearInterval(interval)
        }

        return () => {
            clearInterval(interval)
        }
    }, [started])


    return (
        <Fragment>
            <View>
                {!!currentLocation && <MapView
                    style={styles.map}
                    followsUserLocation
                    initialRegion={{ ...initialLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }}
                    userLocationPriority={'balanced'}
                    userLocationUpdateInterval={1000}
                    onMapReady={() => console.log('started')}
                    region={{ ...currentLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }}
                    focusable
                >
                    <Marker
                        coordinate={currentLocation}
                        draggable={false}
                        flat
                        image={require('../../assets/truck.png')} />
                </MapView>}

            </View>

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: '#2214a9', position: 'absolute', bottom: 96, left: 0, right: 0, width: '100%' }]}>
                <Button color={'white'} title='Start Tracking' onPress={handleStartTracking} disabled={started} />
            </View>
            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: '#873600', position: 'absolute', bottom: 32, left: 0, right: 0, width: '100%' }]}>
                <Button color={'white'} title='Stop Tracking' onPress={stopTracking} disabled={!started} />
            </View>
        </Fragment>
    )
}

async function saveCurrentLocation(locations: any[]) {
    try {
        await AsyncStorage.setItem(STORAGE_CURRENT_LOCATION_KEY, JSON.stringify({
            latitude: locations[0].coords.latitude,
            longitude: locations[0].coords.longitude,
        }));
    } catch (e) {
        return {};
    }
}
async function getSavedCurrentLocation() {
    try {
        const item = await AsyncStorage.getItem(STORAGE_CURRENT_LOCATION_KEY);
        return item ? JSON.parse(item) : {};
    } catch (e) {
        return [];
    }
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
    try {
        if (error) {
            // Error occurred - check `error.message` for more details.
            console.log('errors: ', error);
            return;
        }
        if (data) {
            const { locations }: any = data;
            // console.log('updated location in ', new Date().toLocaleTimeString(), locations)

            saveCurrentLocation(locations)
        } else {
            saveCurrentLocation([{ latitude: 31.945368, longitude: 35.928371 }])
        }
    } catch (error) {
        console.log('catched error: ', error);
    }
});

const requestPermissions = async () => {
    try {
        await Location.requestBackgroundPermissionsAsync();
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            showsBackgroundLocationIndicator: true,
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 15000,
            foregroundService: {
                notificationTitle: LOCATION_TASK_NAME,
                notificationBody: 'Background location is running...',
                notificationColor: 'blue',
            },
            mayShowUserSettingsDialog: true,
            pausesUpdatesAutomatically: false,
            deferredUpdatesInterval: 15000,
            activityType: Location.LocationActivityType.AutomotiveNavigation,
        });
    } catch (error) {
        console.log('catched error require permissions: ', error);
    }
};