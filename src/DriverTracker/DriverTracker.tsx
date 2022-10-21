import React, { Fragment, useEffect, useState } from 'react'
import { Button, View } from 'react-native'
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { getAll, insertLog } from '../utils/db/sqliteConfig';
import { ApiService } from '../utils/api/axio-setup';
import { getSavedCurrentLocation, requestPermissions, LOCATION_TASK_NAME, INTERVAL, handleOnlineService } from './utils';
import MapViewComponent from './MapViewComponent';

export const DriverTracker = () => {
    const { isConnected, isInternetReachable } = NetInfo.useNetInfo();
    const [hasOfflineLogs, setHasOfflineLogs] = useState<boolean>(false);
    const [started, setStarted] = useState(false);

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

    // const handleOnline = async () => {
    //     try {
    //         const current = await getSavedCurrentLocation()
    //         // console.log('current location: ', current);
    //         // setCurrentLocation(current)
    //         if ((!isConnected || !isInternetReachable)) {
    //             insertLog(String(Date.now()), String(current?.longitude), String(current?.latitude));
    //             setHasOfflineLogs(true);
    //             console.log('saved to offline storage sqlite');
    //         } else {
    //             console.log('hasOfflineLogs: ', hasOfflineLogs);
    //             if (hasOfflineLogs) {
    //                 // handle
    //                 getAll();
    //                 setHasOfflineLogs(false);
    //             } else {
    //                 const response = await ApiService.postRequest(
    //                     "/oneLocation",
    //                     { "lng": current?.longitude, "lat": current?.latitude });

    //                 console.log('response: ', response);

    //             }
    //         }
    //     } catch (error) {
    //         console.log('update location error');
    //     }
    // }

    const handleStartTracking = () => {
        setStarted(true)
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
        const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
        setStarted(isTaskDefined);
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

    return (
        <Fragment>
            {/* <MapViewComponent initialLocation={initialLocation} currentLocation={currentLocation} /> */}

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 96, left: 0, right: 0, width: '100%' }]}>
                <Button color={'blue'} title='Start Tracking' onPress={handleStartTracking} disabled={started} />
            </View>

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 32, left: 0, right: 0, width: '100%' }]}>
                <Button color={'red'} title='Stop Tracking' onPress={stopTracking} disabled={!started} />
            </View>

        </Fragment>
    )
}
