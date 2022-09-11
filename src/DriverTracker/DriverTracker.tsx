import React, { Fragment, useEffect, useState } from 'react'
import { Button, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
// import Device from 'expo-device';
import NetInfo from '@react-native-community/netinfo';
import { getAll, insertLog } from '../utils/db/sqliteConfig';
import { ApiService } from '../utils/api/axio-setup';
import { styles } from './styles';
import { getSavedCurrentLocation, requestPermissions, LOCATION_TASK_NAME, INTERVAL, LATITUDE_DELTA, LONGITUDE_DELTA } from './utils';


export const DriverTracker = () => {
    const { isConnected, isInternetReachable } = NetInfo.useNetInfo();
    const [hasOfflineLogs, setHasOfflineLogs] = useState<boolean>(false);
    const [started, setStarted] = useState(false);

    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [initialLocation, setInitialLocation] = useState<any>(null);

    const requestPermissions = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
          });
        } else {
            console.log('not granted ');
        }
      };

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
            console.log('current location: ', current);
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
                {(!!currentLocation && !!initialLocation) && <MapView
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
                </MapView>}
            </View>

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 96, left: 0, right: 0, width: '100%' }]}>
                <Button color={'blue'} title='Start Tracking' onPress={handleStartTracking} disabled={started} />
            </View>

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 32, left: 0, right: 0, width: '100%' }]}>
                <Button color={'red'} title='Stop Tracking' onPress={stopTracking} disabled={!started} />
            </View>

        </Fragment>
    )
}
