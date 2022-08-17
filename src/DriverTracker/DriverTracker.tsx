import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import MapView, { Marker } from 'react-native-maps';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { styles } from './styles';
import { deleteFromDriverLogTable, dropDriverLogTable, getAll, insertLog } from '../utils/db/sqliteConfig';

const LOCATION_TASK_NAME = 'background-location-task';
const LATITUDE_DELTA = 0.004;
const LONGITUDE_DELTA = 0.004;

export const DriverTracker = () => {
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [initialLocation, setInitialLocation] = useState<any>(null);

    const getInitialCurrentLocation = async () => {
        try {
            const current = await Location.getCurrentPositionAsync();
            // console.log('current: ', current);
            setInitialLocation({
                latitude: current?.coords.latitude,
                longitude: current?.coords.longitude
            })
        } catch (error) {
            console.log('catched getInitialCurrentLocation error: ', error);
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

                // uncomment to test
                // insertLog(String(Date.now()), String(locations[0]?.coords.longitude), String(locations[0]?.coords.latitude));
            } else {
                setCurrentLocation({ latitude: 31.945368, longitude: 35.928371 })
            }
        } catch (error) {
            console.log('catched error: ', error);
        }
    });

    const requestPermissions = async () => {
        try {
            const { status, granted, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
            // console.log('canAskAgain: ', canAskAgain, status, granted);
            if (status !== "granted" || !granted) {
                console.log(
                    "Insufficient permissions!",
                    "Sorry, we need location permissions to make this work!")
                return;
            }
            if (status === 'granted' || granted) {
                await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                    showsBackgroundLocationIndicator: true,
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                });
            }
        } catch (error) {
            console.log('catched error require permissions: ', error);

        }
    };

    useEffect(() => {
        requestPermissions();
        getInitialCurrentLocation();

        // uncomment to test getting data from db table
        // getAll();
    }, [])

    return (
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
    )
}
