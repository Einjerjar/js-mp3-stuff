import path from 'path'
import blessed from 'blessed'
import contrib from 'blessed-contrib'
import { globby } from 'globby'

const screen = blessed.screen({
  smartCSR: true
})

screen.title = 'kek'

const list = blessed.list({
  top: '0%',
  left: '0%',
  width: '50%',
  height: '100%',
  content: 'Hello {bold}world{/bold}!',
  tags: true,
  border: {
    type: 'line'
  }
})

const songs = (await globby('./songs/*.mp3'))
  .map(v => path.parse(v).name)
  .forEach(v => list.add(v))


screen.append(list)

screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  return process.exit(0)
})

list.focus()

screen.render()