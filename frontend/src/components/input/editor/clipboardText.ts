import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

const BULLET_LIST_TYPES = ['bulletList', 'taskList']
const ORDERED_LIST_TYPES = ['orderedList']

// Plain text for a copied selection. ProseMirror's default flattens lists into plain
// lines, losing the markers that tell the reader they were list items.
export function serializeSliceAsText(slice: Slice): string {
	return blockLines(slice.content, '').join('\n')
}

function blockLines(fragment: Fragment, indent: string): string[] {
	const lines: string[] = []
	fragment.forEach(node => lines.push(...nodeLines(node, indent)))
	return lines
}

function nodeLines(node: ProseMirrorNode, indent: string): string[] {
	const typeName = node.type.name

	if (BULLET_LIST_TYPES.includes(typeName) || ORDERED_LIST_TYPES.includes(typeName)) {
		const lines: string[] = []
		let number = 1
		node.forEach(item => {
			const marker = ORDERED_LIST_TYPES.includes(typeName) ? `${number++}. ` : '- '
			const continuation = indent + ' '.repeat(marker.length)
			const itemLines = blockLines(item.content, continuation)
			if (itemLines.length === 0) {
				lines.push(indent + marker.trimEnd())
				return
			}
			// The first line of the item carries the marker instead of the continuation indent.
			itemLines[0] = indent + marker + itemLines[0].slice(continuation.length)
			lines.push(...itemLines)
		})
		return lines
	}

	if (node.isTextblock) {
		return [indent + node.textContent]
	}

	if (node.isLeaf) {
		return node.textContent ? [indent + node.textContent] : []
	}

	return blockLines(node.content, indent)
}
