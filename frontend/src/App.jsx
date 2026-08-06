import useAtlasStore from './store/atlasStore'
import EntryScene from './scenes/EntryScene'
import DescentScene from './scenes/DescentScene'

export default function App() {
  const currentScene = useAtlasStore((s) => s.currentScene)

  return (
    <>
      {currentScene === 'entry' && <EntryScene />}
      {(currentScene === 'descent' || currentScene === 'emergence') && <DescentScene />}
    </>
  )
}
