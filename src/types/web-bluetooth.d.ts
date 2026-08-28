type BluetoothServiceUUID = number | string

interface BluetoothLEScanFilter {
  name?: string
  namePrefix?: string
  services?: Array<BluetoothServiceUUID>
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
