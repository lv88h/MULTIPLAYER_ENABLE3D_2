// game.js
import Player from './player.js'

class Game extends Scene3D {
  // ... previous code ...

  create() {
    // ... previous code ...

    this.players = {}
    this.socket = io()

    this.socket.on('newPlayer', (data) => {
      this.addPlayer(data.id, data.x, data.y, data.z)
    })

    this.socket.on('playerMove', (data) => {
      if (this.players[data.id]) {
        this.players[data.id].position.set(data.x, data.y, data.z)
      }
    })

    this.socket.on('playerDisconnected', (id) => {
      if (this.players[id]) {
        this.players[id].destroy()
        delete this.players[id]
      }
    })

    // Add local player
    this.localPlayer = new Player(this, 0, 1, 0)
    this.socket.emit('newPlayer', { x: 0, y: 1, z: 0 })
  }

  addPlayer(id, x, y, z) {
    this.players[id] = new Player(this, x, y, z)
  }

  update() {
    // Handle local player movement
    const keys = this.input.keyboard.createCursorKeys()
    const direction = { x: 0, z: 0 }

    if (keys.left.isDown) direction.x = -1
    if (keys.right.isDown) direction.x = 1
    if (keys.up.isDown) direction.z = -1
    if (keys.down.isDown) direction.z = 1

    this.localPlayer.move(direction)

    if (keys.space.isDown) {
      this.localPlayer.jump()
    }

    this.localPlayer.update()

    // Send local player position to server
    this.socket.emit('playerMove', {
      x: this.localPlayer.position.x,
      y: this.localPlayer.position.y,
      z: this.localPlayer.position.z
    })

    // Update other players
    Object.values(this.players).forEach(player => player.update())
  }
}
