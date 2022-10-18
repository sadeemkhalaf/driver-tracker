import React, { Fragment, useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus, Button, Platform, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { getAll, insertLog } from '../utils/db/sqliteConfig';
import { ApiService } from '../utils/api/axio-setup';
import { styles } from './styles';
import { getSavedCurrentLocation, requestPermissions, LOCATION_TASK_NAME, INTERVAL, LATITUDE_DELTA, LONGITUDE_DELTA, handleOnlineService, registerBackgroundFetchAsync } from './utils';

export const DriverTracker = () => {
    const { isConnected, isInternetReachable } = NetInfo.useNetInfo();
    const [hasOfflineLogs, setHasOfflineLogs] = useState<boolean>(false);
    const [started, setStarted] = useState(TaskManager.isTaskDefined(LOCATION_TASK_NAME));

    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [initialLocation, setInitialLocation] = useState<any>(null);

    const getInitialCurrentLocation = async () => {
        // TODO: crashes on Android
        // catched getInitialCurrentLocation error:  [Error: Not authorized to use location services.]
        try {
            const current = await Location.getCurrentPositionAsync();
            setInitialLocation({
                latitude: current?.coords?.latitude,
                longitude: current?.coords?.longitude
            })
        } catch (error) {
            console.log('catched getInitialCurrentLocation error: ', error);
        }
    }

    const handleOnline = async () => {
        try {
            const current = await getSavedCurrentLocation()
            // console.log('current location: ', current);
            // setCurrentLocation(current)
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
                    const response = await ApiService.postRequest(
                        "/oneLocation",
                        { "lng": current?.longitude, "lat": current?.latitude });

                    console.log('response: ', response);

                }
            }
        } catch (error) {
            console.log('update location error');
        }
    }

    const handleStartTracking = () => {
        setStarted(true)
        // registerBackgroundFetchAsync()
        requestPermissions()
    }

    const stopTracking = async () => {
        if (TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
            try {
                await TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);
            } catch (err) {
                console.error(err);
            } finally {
                setStarted(false)
            }
        }
    }

    useEffect(() => {
        getInitialCurrentLocation();
    }, [])


    useEffect(() => {
        let interval = setInterval(() => {
            if (started) {
                console.log('interval ran on ', new Date().toLocaleTimeString());
                // handleOnline()
                handleOnlineService()
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


    const onPress = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
            console.log('granted');

            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 3000,
                foregroundService: {
                    notificationTitle: "BackgroundLocation Is On",
                    notificationBody: "We are tracking your location",
                    notificationColor: "#ffce52",
                },
            });
        }
    };


    return (
        <Fragment>

            {Platform.OS === 'ios' && <View>
                {/* {(!!currentLocation && !!initialLocation) && <MapView
                    style={styles.map}
                    followsUserLocation
                    showsUserLocation={true}
                    liteMode
                    initialRegion={{ ...initialLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }}
                    userLocationPriority={'balanced'}
                    userLocationUpdateInterval={1000}
                    onMapReady={() => console.log('started')}
                    region={{ ...currentLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }}
                    focusable
                    provider={PROVIDER_GOOGLE}
                >
                    <Marker
                        coordinate={currentLocation}
                        draggable={false}
                        flat
                        image={require('../../assets/truck.png')} />
                </MapView>} */}
            </View>}

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 96, left: 0, right: 0, width: '100%' }]}>
                <Button color={'blue'} title='Start Tracking' onPress={handleStartTracking} disabled={started} />
            </View>

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 32, left: 0, right: 0, width: '100%' }]}>
                <Button color={'red'} title='Stop Tracking' onPress={stopTracking} disabled={!started} />
            </View>

        </Fragment>
    )
}
