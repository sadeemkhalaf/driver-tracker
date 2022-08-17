import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Asset } from "expo-asset";

// in case of an existing DB 
async function openDatabase(
  pathToDatabaseFile: string
): Promise<SQLite.WebSQLDatabase> {
  if (
    !(await FileSystem.getInfoAsync(FileSystem.documentDirectory + "SQLite"))
      .exists
  ) {
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "SQLite"
    );
  }
  await FileSystem.downloadAsync(
    Asset.fromModule(require(pathToDatabaseFile)).uri,
    FileSystem.documentDirectory + "SQLite/driverApp.db"
  );
  
  return SQLite.openDatabase('driverApp.db', '0.1', '', undefined, (response) => {
    console.log('opened sqlite db, version:', response.version)
  });
}
