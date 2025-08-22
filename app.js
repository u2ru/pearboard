import Hyperswarm from 'hyperswarm'
import { setupSwarmHandlers } from './src/modules/swarm.js'
import { setupFormHandlers } from './src/modules/forms.js'

const { teardown, updates } = Pear

const swarm = new Hyperswarm()

teardown(() => swarm.destroy())
updates(() => Pear.reload())

setupSwarmHandlers(swarm)
setupFormHandlers(swarm)
