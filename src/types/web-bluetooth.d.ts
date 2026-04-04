type BluetoothServiceUUID = number | string

interface BluetoothLEScanFilter {
  name?: string
  namePrefix?: string
  services?: BluetoothServiceUUID[]
}

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer
  id?: string
  name?: string
}

interface BluetoothRemoteGATTServer {
  connected?: boolean
  device?: BluetoothDevice
}
