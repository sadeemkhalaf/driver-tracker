import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import { ApiService } from "../api/axio-setup";

const DRIVER_TABLE_NAME = "DriverLogTable";

// TODO: convert to class

const openDatabase = () => {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("driverApp.db", "0.1", "", undefined, (res) =>
    console.log(res, "successfully opened")
  );
  db.exec([{ sql: "PRAGMA foreign_keys = ON;", args: [] }], false, () =>
    console.log("Foreign keys turned on")
  );
  return db;
};

const db = openDatabase();

export const addDataToDb = () => {
  db.transaction(
    (tx) => {
      tx.executeSql(
        `create table if not exists ${DRIVER_TABLE_NAME} (id integer primary key not null, created_at int not null, long text not null, lat text not null);`,
        []
      );
      console.log("created table successfully ", DRIVER_TABLE_NAME);
    },
    (error) => {
      console.log("failed to create table ", DRIVER_TABLE_NAME, error);
    }
  );
  //
  console.log("db created");
};

const testPostSavedData = async (_array: any[], length: number) => {
  console.log("results: ", _array);
  if (length > 1) {
    console.log("has more than 1 record");
    const mappedArray = _array.map((value) => {
      return { lng: String(value.long), lat: String(value.lat) };
    });
    console.log({
      listoflocations: [...mappedArray],
    });
    const response = await ApiService.putRequest("/listofLocations", {
      listoflocations: [...mappedArray],
    });
    if (response.status === 201) {
      console.log("add all, response.status", response.status);
      dropDriverLogTable();
    } else {
      console.log("something went wrong");
    }
  }
};

export const getAll = (setValues?: any) => {
  db.transaction((tx) => {
    tx.executeSql(
      `select * from ${DRIVER_TABLE_NAME}`,
      [],
      (_, { rows }) => {
        console.log("results from ", DRIVER_TABLE_NAME, rows._array);
        setValues && setValues(rows._array);
        testPostSavedData(rows._array, rows.length);
      },
      (error) => {
        console.log("error to getall");
        return false;
      }
    );
  });
};

export const insertLog = (createdAt: string, lang: string, lat: string) => {
  db.transaction(
    (tx) => {
      tx.executeSql(
        `insert into ${DRIVER_TABLE_NAME} (created_at, long, lat) values (?, ?, ?)`,
        [createdAt, lang, lat]
      );
    },
    (error) => {
      console.log("failed to insert, ", error);
    }
  );
};

export const deleteFromDriverLogTable = (id: number) => {
  db.transaction(
    (tx) => {
      tx.executeSql(`delete from ${DRIVER_TABLE_NAME} where locationsId = ?;`, [
        id,
      ]);
    },
    (error) => {
      console.log("failed to delete error: ", error);
    },
    () => {
      console.log("successfully deleted locationsId: ", id);
    }
  );
};

export const dropDriverLogTable = () => {
  db.transaction((tx) => {
    tx.executeSql(`DROP table ${DRIVER_TABLE_NAME}`, [], (res) =>
      console.log("successfully droped table", DRIVER_TABLE_NAME, res)
    ),
      () => console.error("drop table error");
  });
};
