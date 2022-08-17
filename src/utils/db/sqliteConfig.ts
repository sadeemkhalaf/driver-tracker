import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

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
  db.transaction((tx) => {
    tx.executeSql(
      `create table if not exists ${DRIVER_TABLE_NAME} (id integer primary key not null, column_datetime int, column_long text, column_lat text);`,
      []
    );
  });
};

export const getAll = (setValues?: any) => {
  db.transaction((tx) => {
    tx.executeSql(
      `select * from ${DRIVER_TABLE_NAME}`,
      [],
      (_, { rows: { _array } }) => {
        console.log("results: ", _array);
        setValues && setValues(_array);
      },
      (error) => {
        console.log("error to getall");
        return false;
      }
    );
  });
};

export const insertLog = (
  argument_1: string,
  argument_2: string,
  argument_3: string
) => {
  db.transaction((tx) => {
    tx.executeSql(
      `insert into ${DRIVER_TABLE_NAME} (column_datetime, column_long, column_lat) values (?, ?, ?)`,
      [argument_1, argument_2, argument_3]
    );
  });
};

export const deleteFromDriverLogTable = (id: number) => {
  db.transaction(
    (tx) => {
      tx.executeSql(`delete from ${DRIVER_TABLE_NAME} where id = ?;`, [id]);
    },
    (error) => {
      console.log("failed to delete error: ", error);
    },
    () => {
      console.log("successfully deleted id: ", id);
    }
  );
};

export const dropDriverLogTable = () => {
  db.transaction((tx) => {
    tx.executeSql(`drop table if exists ${DRIVER_TABLE_NAME}`, [], (res) =>
      console.log("successfully droped table DRIVER_TABLE_NAME, ", res)
    ),
      () => console.error("drop table error");
  });
};
