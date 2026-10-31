
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

// Starting enemy positions
const START_ENEMIES = [
  { id: 1, x: 0, z: -8 },
  { id: 2, x: -5, z: -12 },
  { id: 3, x: 5, z: -15 },
]

// Green ground and brown boxes
function Arena() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#39804a" />
      </mesh>

      {[
        [-6, 1, -5],
        [6, 1, -7],
        [-8, 1, 7],
        [8, 1, 5],
      ].map((pos, index) => (
        <mesh key={index} position={pos}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
      ))}
    </>
  )
}

// Blue player with gun
function Player({ keys, playerPosition }) {
  const player = useRef()

  useFrame(({ camera }, delta) => {
    if (!player.current) return

    const speed = 5 * Math.min(delta, 0.05)

    if (keys.current.w) player.current.position.z -= speed
    if (keys.current.s) player.current.position.z += speed
    if (keys.current.a) player.current.position.x -= speed
    if (keys.current.d) player.current.position.x += speed

    player.current.position.x = THREE.MathUtils.clamp(
      player.current.position.x, -18, 18
    )

    player.current.position.z = THREE.MathUtils.clamp(
      player.current.position.z, -18, 18
    )

    playerPosition.current.copy(player.current.position)

    const targetCamera = new THREE.Vector3(
      player.current.position.x,
      7,
      player.current.position.z + 10
    )

    camera.position.lerp(targetCamera, 0.08)

    camera.lookAt(
      player.current.position.x,
      1,
      player.current.position.z
    )
  })

  return (
    <group ref={player}>
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 2, 0.7]} />
        <meshStandardMaterial color="blue" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color="#f4b183" />
      </mesh>

      {/* Gun */}
      <mesh position={[0.5, 1.4, -0.5]}>
        <boxGeometry args={[0.2, 0.2, 1.2]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </group>
  )
}

// Red enemies
function Enemy({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 2, 0.7]} />
        <meshStandardMaterial color="red" />
      </mesh>

      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color="#ff9999" />
      </mesh>
    </group>
  )
}

// Yellow bullets moving forward
function Bullet({ bullet, onHit, onRemove, enemies }) {
  const bulletRef = useRef()
  const position = useRef(
    new THREE.Vector3(bullet.x, 1.4, bullet.z)
  )
  const finished = useRef(false)

  useFrame((_, delta) => {
    if (finished.current || !bulletRef.current) return

    position.current.z -= 20 * Math.min(delta, 0.05)
    bulletRef.current.position.copy(position.current)

    const enemy = enemies.find((target) => {
      const dx = position.current.x - target.x
      const dz = position.current.z - target.z

      return Math.sqrt(dx * dx + dz * dz) < 0.75
    })

    if (enemy) {
      finished.current = true
      onHit(bullet.id, enemy.id)
      return
    }

    if (position.current.z < -20) {
      finished.current = true
      onRemove(bullet.id)
    }
  })

  return (
    <mesh ref={bulletRef} position={[bullet.x, 1.4, bullet.z]}>
      <sphereGeometry args={[0.18, 12, 12]} />
      <meshStandardMaterial
        color="yellow"
        emissive="orange"
        emissiveIntensity={0.8}
      />
    </mesh>
  )
}

// Main game
export default function App() {
  const keys = useRef({})
  const playerPosition = useRef(new THREE.Vector3())

  const [enemies, setEnemies] = useState(START_ENEMIES)
  const [bullets, setBullets] = useState([])
  const [score, setScore] = useState(0)

  const nextBulletId = useRef(0)
  const enemiesRef = useRef(START_ENEMIES)

  useEffect(() => {
    enemiesRef.current = enemies
  }, [enemies])

  useEffect(() => {
    const down = (event) => {
      const key = event.key.toLowerCase()
      keys.current[key] = true

      if (event.code === 'Space') {
        event.preventDefault()

        if (event.repeat) return

        nextBulletId.current += 1

        setBullets((prev) => [
          ...prev,
          {
            id: nextBulletId.current,
            x: playerPosition.current.x,
            z: playerPosition.current.z - 0.8,
          },
        ])
      }
    }

    const up = (event) => {
      keys.current[event.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const removeBullet = (bulletId) => {
    setBullets((prev) =>
      prev.filter((bullet) => bullet.id !== bulletId)
    )
  }

  const hitEnemy = (bulletId, enemyId) => {
    removeBullet(bulletId)

    if (!enemiesRef.current.some((e) => e.id === enemyId)) {
      return
    }

    enemiesRef.current = enemiesRef.current.filter(
      (e) => e.id !== enemyId
    )

    setEnemies(enemiesRef.current)
    setScore((prev) => prev + 10)
  }

  const restartGame = () => {
    setEnemies(START_ENEMIES)
    enemiesRef.current = START_ENEMIES
    setBullets([])
    setScore(0)
  }

  return (
    <div className="game">
      <div className="hud">
        <h2>ABBAS BATTLE ARENA</h2>
        <p>❤️ Health: 100</p>
        <p>🏆 Score: {score}</p>
        <p>🎯 Enemies: {enemies.length}</p>
        <p>🎮 Move: W A S D</p>
        <p>🔫 Shoot: SPACEBAR</p>

        <button onClick={restartGame}>
          Restart Game
        </button>

        {enemies.length === 0 && (
          <p style={{ color: 'yellow' }}>
            🏆 YOU WIN!
          </p>
        )}
      </div>

      <Canvas camera={{ position: [0, 7, 10], fov: 65 }}>
        <Arena />

        <Player
          keys={keys}
          playerPosition={playerPosition}
        />

        {enemies.map((enemy) => (
          <Enemy
            key={enemy.id}
            x={enemy.x}
            z={enemy.z}
          />
        ))}

        {bullets.map((bullet) => (
          <Bullet
            key={bullet.id}
            bullet={bullet}
            enemies={enemies}
            onHit={hitEnemy}
            onRemove={removeBullet}
          />
        ))}
      </Canvas>
    </div>
  )
}
