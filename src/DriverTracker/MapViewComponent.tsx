import { View, Text, Platform } from 'react-native'
import React, { FC, Fragment } from 'react'
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps'
import { styles } from './styles'
import { LATITUDE_DELTA, LONGITUDE_DELTA } from './utils'

interface MapComponentProps {
    initialLocation: Region | undefined
    currentLocation: Region | undefined
}

const MapViewComponent: FC<MapComponentProps> = ({ initialLocation, currentLocation }) => {
    return (
        <Fragment>
            {Platform.OS === 'ios' ? <View>
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
            </View> : null}
        </Fragment>
    )
}

export default MapViewComponent