const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const colourPicker = document.getElementById('colourPicker');
const colourButton = document.getElementById('colourButton');
const connect = document.getElementById('connect');
const deviceHeartbeat = document.getElementById('deviceHeartbeat');

var my_device;
var cmd_rx_characteristic;
var cmd_tx_characteristic;

function handleCmdRx(event) {

}

function onDisconnect(event) {
    const device = event.target;
    if (cmd_rx_characteristic) {
        cmd_rx_characteristic.stopNotifications()
        .then(_ => {
          log('Notifications stopped');
          cmd_rx_characteristic.removeEventListener('characteristicvaluechanged',
            handleCmdRx);
        })
        .catch(error => {
          log('Argh! ' + error);
        });
      }
}

function getSupportedProperties(characteristic) {
    let supportedProperties = [];
    for (const p in characteristic.properties) {
      if (characteristic.properties[p] === true) {
        supportedProperties.push(p.toUpperCase());
      }
    }
    return '[' + supportedProperties.join(', ') + ']';
  }


//Find the device and rx/tx characterstics...

connectButton.onclick = async () => {
  navigator.bluetooth.requestDevice({ filters: [{ services: ['DE3A0001-7100-57EF-9190-F1BE84232730'] }] })
  .then(device => {
      my_device = device;
      device.addEventListener('gattserverdisconnected', onDisconnect);
      return device.gatt.connect();
  })
  .then(server => server.getPrimaryService('DE3A0001-7100-57EF-9190-F1BE84232730'))
  .then(service => service.getCharacteristics('803C3B1F-D300-1120-0530-33A62B7838C9'))
  .then(characteristics => {
      console.log(characteristics.length + ' characteristics');
      characteristics.forEach(characteristic => {
          console.log(getSupportedProperties(characteristic));
          console.log(characteristic.uuid);
          if(characteristic.uuid == "803C3B1F-D300-1120-0530-33A62B7838C9") {
              if(characteristic.properties.read) {
                  console.log('Found cmd_rx characteristic');
                  cmd_rx_characteristic = characteristic;
                  characteristic.startNotifications()
                  .then(characteristic => {
                      characteristic.addEventListener('characteristicvaluechanged',
                          handleCmdRx);
                      console.log('Notifications started.');
                  });
              } else if(characteristic.properties.writeWithoutResponse) {
                  console.log('Found cmd_tx characteristic');
                  cmd_tx_characteristic = characteristic;
              }
          }
      });
  });
}
