import React, { Fragment, useEffect, useState } from 'react'
import { Button, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { getAll, insertLog } from '../utils/db/sqliteConfig';
import { styles } from './styles';
import { ApiService } from '../utils/api/axio-setup';
import { LocationActivityType } from 'expo-location';


export const DriverTracker = () => {
    // constants
    const LOCATION_TASK_NAME = 'background-location-task';
    const LATITUDE_DELTA = 0.004;
    const LONGITUDE_DELTA = 0.004;

    const { isConnected, isInternetReachable } = NetInfo.useNetInfo();
    const [hasOfflineLogs, setHasOfflineLogs] = useState<boolean>(false);

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

    const handleOnline = async (locations: any[]) => {
        try {
            if (!isConnected || !isInternetReachable) {
                insertLog(String(Date.now()), String(locations[0]?.coords.longitude), String(locations[0]?.coords.latitude));
                setHasOfflineLogs(true);
                console.log('saved to offline storage sqlite');
            } else {
                if (hasOfflineLogs) {
                    // handle
                    getAll();
                    setHasOfflineLogs(false);
                } else {
                    await ApiService.postRequest(
                        "/oneLocation",
                        { "lng": locations[0]?.coords.longitude, "lat": locations[0]?.coords.latitude });
                }
            }
        } catch (error) {
            console.log('update location error');

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
                // do something with the locations captured in the background
                setCurrentLocation({ latitude: locations[0]?.coords?.latitude, longitude: locations[0]?.coords.longitude });
                handleOnline(locations)
            } else {
                setCurrentLocation({ latitude: 31.945368, longitude: 35.928371 })
            }
        } catch (error) {
            console.log('catched error: ', error);
        }
    });

    const requestPermissions = async () => {
        try {
            await Location.requestBackgroundPermissionsAsync();
            // if (status === 'granted' || granted) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                showsBackgroundLocationIndicator: true,
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 8000,
                distanceInterval: 50,
                activityType: LocationActivityType.AutomotiveNavigation,
            });

            // } 
            // else {
            // console.log(
            //     "Insufficient permissions!",
            //     "Sorry, we need location permissions to make this work!")
            // return;
            // }
        } catch (error) {
            console.log('catched error require permissions: ', error);
        }
    };

    const stopTracking = async () => {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }


    useEffect(() => {
        getInitialCurrentLocation();
    }, [])

    return (
        <Fragment>
            <View>
                {!!currentLocation && <MapView
                    style={styles.map}
                    followsUserLocation
                    initialRegion={{ ...initialLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }}
                    userLocationPriority={'balanced'}
                    userLocationUpdateInterval={150}
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
                <Button color={'white'} title='Start Tracking' onPress={requestPermissions} />
            </View>
            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: '#873600', position: 'absolute', bottom: 32, left: 0, right: 0, width: '100%' }]}>
                <Button color={'white'} title='Stop Tracking' onPress={stopTracking} />
            </View>
        </Fragment>
    )
}
