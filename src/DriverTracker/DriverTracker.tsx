import React, { Fragment, useEffect, useState } from 'react'
import { Button, View } from 'react-native'
import * as TaskManager from 'expo-task-manager';
import { requestPermissions, LOCATION_TASK_NAME, handleOnlineService } from './utils';

export const DriverTracker = () => {
    const [started, setStarted] = useState(false);

    const handleStartTracking = () => {
        setStarted(true)
        requestPermissions()
        handleOnlineService()
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
    const isTaskDefined = async () => {
        const test = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)
        setStarted(test)
    }

    useEffect(() => {
        isTaskDefined();
    }, [])

    return (
        <Fragment>
            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 96, left: 0, right: 0, width: '100%' }]}>
                <Button color={'blue'} title='Start Tracking' onPress={handleStartTracking} disabled={started} />
            </View>

            <View style={[{ paddingHorizontal: 36, paddingVertical: 12, backgroundColor: 'transparent', position: 'absolute', bottom: 32, left: 0, right: 0, width: '100%' }]}>
                <Button color={'red'} title='Stop Tracking' onPress={stopTracking} disabled={!started} />
            </View>

        </Fragment>
    )
}
