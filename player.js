// player.js
import { ExtendedObject3D } from 'enable3d'

class Player extends ExtendedObject3D {
  constructor(scene, x, y, z) {
    super()

    this.scene = scene
    this.position.set(x, y, z)

    this.body = scene.physics.add.box({ width: 0.5, height: 1, depth: 0.5 }, { lambert: { color: 'blue' } })
    this.body.position.set(x, y, z)

    this.speed = 5
    this.jumpForce = 5
  }

  move(direction) {
    this.body.setVelocity(direction.x * this.speed, this.body.velocity.y, direction.z * this.speed)
  }

  jump() {
    if (this.body.velocity.y === 0) {
      this.body.setVelocity(this.body.velocity.x, this.jumpForce, this.body.velocity.z)
    }
  }

  update() {
    this.position.copy(this.body.position)
  }
}

export default Player
