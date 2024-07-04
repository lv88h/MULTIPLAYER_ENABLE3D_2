add files via upload node server.js launches server on 3000 port, (sudo kill -9 sudo lsof -t -i:3000 ) to kill port, so You can launch server again.

npm install enable3d socket.io express mongodb bcrypt jsonwebtoken express passport passport-local express-session

sudo apt-get install -y mongodb-org

code problems -> login and register function work, but every player gets logged in , in "different world"
to fix the issue check the code in index.html - addMan() function should use array of players and there locations
and be executed every time somebody logs in.


To show multiple logged-in users when they are authorized, you'll need to make several changes to both the client-side and server-side code. Here's a general approach to implement this feature:

On the server side:

Maintain a list of connected users
Broadcast user join/leave events
Send the current list of users to newly connected clients


On the client side:

Listen for user join/leave events
Update the game scene with new players
Remove players when they disconnect



Here's how you can modify your client-side code to accommodate these changes:

Add a players object to store other connected players:

class MainScene extends Scene3D {
  constructor() {
    super('MainScene')
    this.players = {}
  }
  // ...
}

Add methods to add and remove other players:

class MainScene extends Scene3D {
  // ...

  async addPlayer(username, position) {
    if (username === currentUser.username) return; // Don't add self

    const object = await this.load.gltf('man')
    const man = object.scene.children[0]

    const player = new ExtendedObject3D()
    player.name = username
    player.add(man)
    player.position.set(position.x, position.y, position.z)

    this.add.existing(player)
    this.players[username] = player

    // Add animations if needed
  }

  removePlayer(username) {
    if (this.players[username]) {
      this.scene.remove(this.players[username])
      delete this.players[username]
    }
  }

  // ...
}

Listen for socket events for player joins and leaves:

socket.on('playerJoined', ({ username, position }) => {
  if (mainScene) {
    mainScene.addPlayer(username, position)
  }
})

socket.on('playerLeft', (username) => {
  if (mainScene) {
    mainScene.removePlayer(username)
  }
})

socket.on('currentPlayers', (players) => {
  Object.entries(players).forEach(([username, data]) => {
    if (username !== currentUser.username) {
      mainScene.addPlayer(username, data.position)
    }
  })
})

Modify the startGame function to pass the scene instance:

let mainScene

function startGame() {
  PhysicsLoader('/lib/ammo/kripken', () => {
    const project = new Project({
      antialias: false,
      maxSubSteps: 10,
      fixedTimeStep: 1 / 120,
      scenes: [MainScene]
    })
    mainScene = project.scene
  })
}

Update player positions regularly:

class MainScene extends Scene3D {
  // ...

  update(time, delta) {
    // ... existing update code ...

    // Emit position update
    if (this.man && this.man.body) {
      this.savePositionCounter = (this.savePositionCounter || 0) + delta
      if (this.savePositionCounter > 100) { // Update every 100ms
        this.savePositionCounter = 0
        const position = this.man.position
        socket.emit('updatePosition', { x: position.x, y: position.y, z: position.z })
      }
    }
  }
}

// Listen for other players' position updates
socket.on('playerMoved', ({ username, position }) => {
  if (mainScene && mainScene.players[username]) {
    mainScene.players[username].position.set(position.x, position.y, position.z)
  }
})
On the server side, you'll need to implement the logic for:

Tracking connected users
Broadcasting join/leave events
Sending current players to new connections
Relaying position updates

These changes will allow you to see other logged-in users in the game world. Remember to handle any potential race conditions or edge cases, such as players joining before the scene is fully loaded.
