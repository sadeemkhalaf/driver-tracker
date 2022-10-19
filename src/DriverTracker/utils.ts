import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as BackgroundFetch from "expo-background-fetch";
import { ApiService } from "../utils/api/axio-setup";
import { getAll, insertLog } from "../utils/db/sqliteConfig";

export const LOCATION_TASK_NAME = "location-tracking";
export const BG_LOCATION_TASK_NAME = "background_location-tracking";
export const STORAGE_CURRENT_LOCATION_KEY = "expo-current-location";
export const INTERVAL = 15000 * 4;
export const LATITUDE_DELTA = 0.004;
export const LONGITUDE_DELTA = 0.004;

export const handleOnlineService = async () => {
  try {
    const current = await getSavedCurrentLocation();
    {
      // @method getAll: gets all offline data and post to server
      await getAll();
      const response = await ApiService.postRequest("/oneLocation", {
        lng: current?.longitude,
        lat: current?.latitude,
      });

      // handle offline
      if (Number(response.status) !== 200 || Number(response.status) !== 201) {
        insertLog(
          String(Date.now()),
          String(current?.longitude),
          String(current?.latitude)
        );
      }
    }
  } catch (error) {
    console.log("update location error");
  }
};

export async function getSavedCurrentLocation() {
  try {
    const item = await AsyncStorage.getItem(STORAGE_CURRENT_LOCATION_KEY);
    return item ? JSON.parse(item) : {};
  } catch (e) {
    return [];
  }
}

export async function saveCurrentLocation(locations: any[]) {
  try {
    await AsyncStorage.setItem(
      STORAGE_CURRENT_LOCATION_KEY,
      JSON.stringify({
        latitude: locations[0]?.coords?.latitude,
        longitude: locations[0]?.coords?.longitude,
      })
    );
  } catch (e) {
    return {};
  }
}

export async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(LOCATION_TASK_NAME, {
    minimumInterval: 5, // task will fire 5 seconds after app is backgrounded
    stopOnTerminate: false,
  });
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  try {
    if (error) {
      // Error occurred - check `error.message` for more details.
      console.log("errors: ", error);
      return;
    }
    if (data) {
      const { locations }: any = data;
      // console.log('updated location in ', new Date().toLocaleTimeString(), locations)
      saveCurrentLocation(locations);
    } else {
      saveCurrentLocation([{ latitude: 31.945368, longitude: 35.928371 }]);
    }
  } catch (error) {
    console.log("catched error: ", error);
  }

  return BackgroundFetch.BackgroundFetchResult.NewData;
});

export const requestPermissions = async () => {
  try {
    const { granted, canAskAgain } =
      await Location.requestBackgroundPermissionsAsync();
    const { granted: grantedBackground } =
      await Location.getBackgroundPermissionsAsync();

    await Location.requestForegroundPermissionsAsync();
    if (granted && grantedBackground) {
      // *** registerBackgroundFetchAsync *** it was the missing line
      await registerBackgroundFetchAsync();
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        showsBackgroundLocationIndicator: true,
        accuracy: Location.Accuracy.BestForNavigation,
        foregroundService: {
          notificationTitle: LOCATION_TASK_NAME,
          notificationBody: "foregroundService location is running...",
          notificationColor: "blue",
        },
        mayShowUserSettingsDialog: true,
        activityType: Location.LocationActivityType.AutomotiveNavigation,
      });
    } else if (canAskAgain) {
      console.log("not granted");
      await Location.requestBackgroundPermissionsAsync();
    }
  } catch (error) {
    console.log("catched error require permissions: ", error);
  }
};
