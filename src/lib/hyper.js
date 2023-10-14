import RAM from 'random-access-memory'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import DHT from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'
import goodbye from 'graceful-goodbye'

export const makeSwarm = async (address = 'wss://dht1-relay.leet.ar:49443') => {
  const ws = new WebSocket(address)
  const dht = new DHT(new Stream(true, ws))
  const swarm = new Hyperswarm({ dht })

  return swarm
}

export const makeRAMStore = async () => {
  const core = new Corestore((filename) => {
    return new RAM()
  })

  //core.on('append', () => {
  //  const seq = core.length - 1
  //  core.get(seq).then(block => {
  //    console.log(`Block ${seq} data: ${b4a.toString(block)}`)
  //  })
  //})

  await core.ready()
  return core
}

export const makeDrive = async (store) => {
  const drive = new Hyperdrive(store)
  await drive.ready()
  return drive
}

