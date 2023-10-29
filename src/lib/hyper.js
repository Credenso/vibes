import RAM from 'random-access-memory'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import DHT from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'
import goodbye from 'graceful-goodbye'
import RAI from 'random-access-idb'

export const makeSwarm = async (address = 'wss://dht1-relay.leet.ar:49443') => {
  const ws = new WebSocket(address)
  const dht = new DHT(new Stream(true, ws))
  const swarm = new Hyperswarm({ dht })

  return swarm
}

export const makeBrowserStore = async (dbName) => {
  const storage = RAI(dbName)
  const core = new Corestore(storage)

  await core.ready()
  return core
}

export const makeRAMStore = async () => {
  const core = new Corestore((filename) => {
    return new RAM()
  })

  await core.ready()
  return core
}

export const makeDrive = async (store) => {
  const drive = new Hyperdrive(store)
  await drive.ready()
  return drive
}

