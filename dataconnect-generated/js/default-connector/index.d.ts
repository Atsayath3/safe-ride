import { ConnectorConfig } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Bus_Key {
  id: UUIDString;
  __typename?: 'Bus_Key';
}

export interface Location_Key {
  id: UUIDString;
  __typename?: 'Location_Key';
}

export interface RouteStop_Key {
  id: UUIDString;
  __typename?: 'RouteStop_Key';
}

export interface Route_Key {
  id: UUIDString;
  __typename?: 'Route_Key';
}

export interface Student_Key {
  id: UUIDString;
  __typename?: 'Student_Key';
}

export interface Trip_Key {
  id: UUIDString;
  __typename?: 'Trip_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

