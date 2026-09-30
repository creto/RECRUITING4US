/** Original write-code prompts generated for this bank. Not copied from another site. */
export const CODING_EXTRA: readonly {
  key: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  prompt: string;
  tags?: string[];
}[] = [
  {
    "key": "even-index-sum",
    "difficulty": "easy",
    "title": "Even index sum",
    "prompt": "Even index sum\n\nWrite `evenIndexSum(values: number[]): number`.\n\nTopic: arrays. Return the sum of values at even indexes. An empty list sums to 0.\n\nExample\nevenIndexSum([4, 9, 1, 7, 3]) returns 8.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "best-shift-run",
    "difficulty": "easy",
    "title": "Best shift run",
    "prompt": "Best shift run\n\nWrite `bestRun(values: number[]): number`.\n\nTopic: arrays, dynamic programming. values[i] is a gain or a loss. Return the largest sum of any contiguous run of at least one value.\n\nExample\nbestRun([-2, 3, -1, 4, -5]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "sorted-pair",
    "difficulty": "easy",
    "title": "Sorted pair",
    "prompt": "Sorted pair\n\nWrite `sortedPair(weights: number[], target: number): [number, number] | null`.\n\nTopic: two pointers. weights is sorted ascending. Return indexes of two different values that add to target, or null. Prefer the smaller left index.\n\nExample\nsortedPair([1, 3, 4, 7, 11], 11) returns [2, 3].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "park-zeros",
    "difficulty": "easy",
    "title": "Park the zeros",
    "prompt": "Park the zeros\n\nWrite `parkZeros(lanes: number[]): number[]`.\n\nTopic: arrays. Move every 0 to the end and keep the relative order of the other numbers.\n\nExample\nparkZeros([0, 1, 0, 3, 12]) returns [1, 3, 12, 0, 0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "badge-plus",
    "difficulty": "easy",
    "title": "Badge plus one",
    "prompt": "Badge plus one\n\nWrite `badgePlus(digits: number[]): number[]`.\n\nTopic: arrays. digits is a non-negative integer, most significant digit first. Return the digits of that number plus one.\n\nExample\nbadgePlus([9, 9]) returns [1, 0, 0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rotate-line",
    "difficulty": "easy",
    "title": "Rotate the line",
    "prompt": "Rotate the line\n\nWrite `rotateLine(values: number[], steps: number): number[]`.\n\nTopic: arrays. Rotate right by steps places. steps may exceed the length.\n\nExample\nrotateLine([1, 2, 3, 4, 5], 2) returns [4, 5, 1, 2, 3].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "sorted-squares",
    "difficulty": "easy",
    "title": "Sorted squares",
    "prompt": "Sorted squares\n\nWrite `sortedSquares(values: number[]): number[]`.\n\nTopic: two pointers. values is sorted and may be negative. Return the squares in ascending order.\n\nExample\nsortedSquares([-4, -1, 0, 3, 10]) returns [0, 1, 9, 16, 100].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "merge-queues",
    "difficulty": "easy",
    "title": "Merge two queues",
    "prompt": "Merge two queues\n\nWrite `mergeQueues(a: number[], b: number[]): number[]`.\n\nTopic: two pointers. Both inputs are sorted ascending. Return one sorted list. Keep duplicates.\n\nExample\nmergeQueues([1, 4, 6], [2, 3, 6]) returns [1, 2, 3, 4, 6, 6].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "unique-sorted-len",
    "difficulty": "easy",
    "title": "Unique sorted length",
    "prompt": "Unique sorted length\n\nWrite `uniqueSortedLength(values: number[]): number`.\n\nTopic: two pointers. values is sorted. Return how many values remain if adjacent duplicates collapse to one.\n\nExample\nuniqueSortedLength([0, 0, 1, 1, 2, 3, 3]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "repeat-badge",
    "difficulty": "easy",
    "title": "Repeated badge",
    "prompt": "Repeated badge\n\nWrite `hasRepeat(ids: number[]): boolean`.\n\nTopic: hashing. Return whether any id appears more than once.\n\nExample\nhasRepeat([3, 1, 4, 1]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "nearby-repeat",
    "difficulty": "easy",
    "title": "Nearby repeat",
    "prompt": "Nearby repeat\n\nWrite `nearbyRepeat(ids: number[], limit: number): boolean`.\n\nTopic: hashing. Return whether some id repeats at two indexes at most limit apart.\n\nExample\nnearbyRepeat([1, 2, 3, 1], 3) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "flip-words",
    "difficulty": "easy",
    "title": "Flip the words",
    "prompt": "Flip the words\n\nWrite `flipWords(sentence: string): string`.\n\nTopic: strings. Reverse the word order. Collapse whitespace to single spaces and drop the ends.\n\nExample\nflipWords('  docks open  late ') returns \"late open docks\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "loose-palindrome",
    "difficulty": "easy",
    "title": "Loose palindrome",
    "prompt": "Loose palindrome\n\nWrite `loosePalindrome(text: string): boolean`.\n\nTopic: two pointers. Ignore case and non-alphanumeric characters. Return whether the rest is a palindrome.\n\nExample\nloosePalindrome('A man, a plan, a canal: Panama') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "almost-palindrome",
    "difficulty": "easy",
    "title": "Almost a palindrome",
    "prompt": "Almost a palindrome\n\nWrite `almostPalindrome(text: string): boolean`.\n\nTopic: two pointers. Return whether deleting at most one character makes text a palindrome. Every character counts.\n\nExample\nalmostPalindrome('abca') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bracket-check",
    "difficulty": "easy",
    "title": "Bracket check",
    "prompt": "Bracket check\n\nWrite `bracketsOk(text: string): boolean`.\n\nTopic: stack. text uses only ()[]{}. Return whether the brackets match and nest.\n\nExample\nbracketsOk('([{}])') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "roman-value",
    "difficulty": "easy",
    "title": "Roman value",
    "prompt": "Roman value\n\nWrite `romanValue(text: string): number`.\n\nTopic: strings. text is a Roman numeral using I, V, X, L, C, D, and M. Return the integer.\n\nExample\nromanValue('MCMXCIV') returns 1994.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "column-title",
    "difficulty": "easy",
    "title": "Column title",
    "prompt": "Column title\n\nWrite `columnTitle(index: number): string`.\n\nTopic: math. Columns run A, B, ..., Z, AA. index starts at 1. Return the title.\n\nExample\ncolumnTitle(28) returns \"AB\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "column-index",
    "difficulty": "easy",
    "title": "Column index",
    "prompt": "Column index\n\nWrite `columnIndex(title: string): number`.\n\nTopic: math. Return the 1-based index of a spreadsheet column title.\n\nExample\ncolumnIndex('ZY') returns 701.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "happy-id",
    "difficulty": "easy",
    "title": "Happy id",
    "prompt": "Happy id\n\nWrite `isHappyId(value: number): boolean`.\n\nTopic: hashing. Replace a positive integer by the sum of the squares of its digits until it repeats. Return whether it reaches 1.\n\nExample\nisHappyId(19) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "trailing-zeros",
    "difficulty": "easy",
    "title": "Trailing zeros",
    "prompt": "Trailing zeros\n\nWrite `trailingZeros(n: number): number`.\n\nTopic: math. Return the number of trailing zeros in n factorial without computing the factorial.\n\nExample\ntrailingZeros(25) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "whole-root",
    "difficulty": "easy",
    "title": "Whole square root",
    "prompt": "Whole square root\n\nWrite `wholeRoot(n: number): number`.\n\nTopic: binary search. Return the greatest integer whose square is at most n.\n\nExample\nwholeRoot(15) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "binary-add",
    "difficulty": "easy",
    "title": "Binary add",
    "prompt": "Binary add\n\nWrite `binaryAdd(a: string, b: string): string`.\n\nTopic: math. a and b are binary strings. Return their sum as a binary string.\n\nExample\nbinaryAdd('1010', '1011') returns \"10101\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "set-bits",
    "difficulty": "easy",
    "title": "Set bits",
    "prompt": "Set bits\n\nWrite `setBits(n: number): number`.\n\nTopic: bits. Return how many bits of the non-negative integer n are 1.\n\nExample\nsetBits(11) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bit-distance",
    "difficulty": "easy",
    "title": "Bit distance",
    "prompt": "Bit distance\n\nWrite `bitDistance(a: number, b: number): number`.\n\nTopic: bits. Return how many bit positions differ between the non-negative integers a and b.\n\nExample\nbitDistance(1, 4) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "power-of-two",
    "difficulty": "easy",
    "title": "Power of two",
    "prompt": "Power of two\n\nWrite `isPowerOfTwo(n: number): boolean`.\n\nTopic: bits. Return whether n is a positive power of two.\n\nExample\nisPowerOfTwo(16) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "stair-count",
    "difficulty": "easy",
    "title": "Stair count",
    "prompt": "Stair count\n\nWrite `stairCount(n: number): number`.\n\nTopic: dynamic programming. Climb n stairs taking 1 or 2 at a time. Order matters. Return the number of ways. n is at least 1.\n\nExample\nstairCount(5) returns 8.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "toll-stairs",
    "difficulty": "easy",
    "title": "Toll stairs",
    "prompt": "Toll stairs\n\nWrite `tollStairs(cost: number[]): number`.\n\nTopic: dynamic programming. cost[i] is paid when you step on stair i. You may start at 0 or 1 and then move one or two stairs. Return the cheapest cost to pass the top.\n\nExample\ntollStairs([10, 15, 20]) returns 15.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "balance-index",
    "difficulty": "easy",
    "title": "Balance index",
    "prompt": "Balance index\n\nWrite `balanceIndex(values: number[]): number`.\n\nTopic: prefix sums. Return the smallest index whose strict left sum equals its strict right sum, or -1. An empty side sums to 0.\n\nExample\nbalanceIndex([1, 7, 3, 6, 5, 6]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "majority-id",
    "difficulty": "easy",
    "title": "Majority id",
    "prompt": "Majority id\n\nWrite `majorityId(ids: number[]): number`.\n\nTopic: voting. One id occurs more than half the time. Return it.\n\nExample\nmajorityId([2, 2, 1, 1, 1, 2, 2]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "missing-gate",
    "difficulty": "easy",
    "title": "Missing gate",
    "prompt": "Missing gate\n\nWrite `missingGate(ids: number[]): number`.\n\nTopic: bits. ids contains every integer from 0 through n except one, where n is the length. Return the missing integer.\n\nExample\nmissingGate([3, 0, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "lone-badge",
    "difficulty": "easy",
    "title": "Lone badge",
    "prompt": "Lone badge\n\nWrite `loneBadge(ids: number[]): number`.\n\nTopic: bits. Every id appears twice except one. Return the one that appears once.\n\nExample\nloneBadge([4, 1, 2, 1, 2]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "common-prefix",
    "difficulty": "easy",
    "title": "Common prefix",
    "prompt": "Common prefix\n\nWrite `commonPrefix(labels: string[]): string`.\n\nTopic: strings. Return the longest shared prefix, or an empty string.\n\nExample\ncommonPrefix(['flower', 'flow', 'flight']) returns \"fl\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "one-room",
    "difficulty": "easy",
    "title": "One room",
    "prompt": "One room\n\nWrite `fitsOneRoom(meetings: [number, number][]): boolean`.\n\nTopic: intervals. Each meeting is half-open [start, end). Return whether one room can hold them all.\n\nExample\nfitsOneRoom([[0, 30], [5, 10], [15, 20]]) returns false.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "grid-routes",
    "difficulty": "easy",
    "title": "Grid routes",
    "prompt": "Grid routes\n\nWrite `gridRoutes(rows: number, cols: number): number`.\n\nTopic: dynamic programming. Count paths from the top-left to the bottom-right moving only right or down.\n\nExample\ngridRoutes(3, 7) returns 28.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "paint-cell",
    "difficulty": "easy",
    "title": "Paint one cell",
    "prompt": "Paint one cell\n\nWrite `paintCell(image: number[][], row: number, col: number, color: number): number`.\n\nTopic: graphs. Recolor the edge-connected region of the starting color. Return the color now at the start cell.\n\nExample\npaintCell([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "unlimited-trades",
    "difficulty": "easy",
    "title": "Unlimited trades",
    "prompt": "Unlimited trades\n\nWrite `unlimitedTrades(prices: number[]): number`.\n\nTopic: greedy. You may buy and sell any number of times but hold at most one share. Return the best profit.\n\nExample\nunlimitedTrades([7, 1, 5, 3, 6, 4]) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "next-taller",
    "difficulty": "easy",
    "title": "Next taller",
    "prompt": "Next taller\n\nWrite `nextTaller(heights: number[]): number[]`.\n\nTopic: stack. For each index return the next strictly taller value to the right, or -1.\n\nExample\nnextTaller([2, 1, 2, 4, 3]) returns [4, 2, 4, -1, -1].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "tree-height",
    "difficulty": "easy",
    "title": "Tree height",
    "prompt": "Tree height\n\nWrite `treeHeight(level: (number | null)[]): number`.\n\nTopic: trees. level is a binary tree in level order, using null for a missing child. Return the node count of the longest root-to-leaf path. An empty tree has height 0.\n\nExample\ntreeHeight([3, 9, 20, null, null, 15, 7]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shallow-leaf",
    "difficulty": "easy",
    "title": "Shallowest leaf",
    "prompt": "Shallowest leaf\n\nWrite `shallowestLeaf(level: (number | null)[]): number`.\n\nTopic: trees. Return the node count of the shortest root-to-leaf path.\n\nExample\nshallowestLeaf([2, null, 3, null, 4]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "balanced-tree",
    "difficulty": "easy",
    "title": "Balanced tree",
    "prompt": "Balanced tree\n\nWrite `isBalancedTree(level: (number | null)[]): boolean`.\n\nTopic: trees. Return whether every node's subtrees differ in height by at most one.\n\nExample\nisBalancedTree([3, 9, 20, null, null, 15, 7]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "mirror-tree",
    "difficulty": "easy",
    "title": "Mirror tree",
    "prompt": "Mirror tree\n\nWrite `isMirrorTree(level: (number | null)[]): boolean`.\n\nTopic: trees. Return whether the tree is symmetric around its center.\n\nExample\nisMirrorTree([1, 2, 2, 3, 4, 4, 3]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "root-to-leaf-target",
    "difficulty": "easy",
    "title": "Root to leaf target",
    "prompt": "Root to leaf target\n\nWrite `hasRootSum(level: (number | null)[], target: number): boolean`.\n\nTopic: trees. Return whether some root-to-leaf path sums to target.\n\nExample\nhasRootSum([5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], 22) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "tree-width",
    "difficulty": "easy",
    "title": "Tree width in edges",
    "prompt": "Tree width in edges\n\nWrite `treeWidth(level: (number | null)[]): number`.\n\nTopic: trees. Return the number of edges on the longest path between any two nodes.\n\nExample\ntreeWidth([1, 2, 3, 4, 5]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "mirror-sum",
    "difficulty": "easy",
    "title": "Mirror and sum",
    "prompt": "Mirror and sum\n\nWrite `mirrorSum(level: (number | null)[]): number`.\n\nTopic: trees. Swap every node's children, then return the sum of the values.\n\nExample\nmirrorSum([4, 2, 7, 1, 3, 6, 9]) returns 32.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "same-trees",
    "difficulty": "easy",
    "title": "Same trees",
    "prompt": "Same trees\n\nWrite `sameTrees(a: (number | null)[], b: (number | null)[]): boolean`.\n\nTopic: trees. Return whether the two level-order trees match in shape and values.\n\nExample\nsameTrees([1, 2, 3], [1, 2, 3]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "level-sums",
    "difficulty": "easy",
    "title": "Level sums",
    "prompt": "Level sums\n\nWrite `levelSums(level: (number | null)[]): number[]`.\n\nTopic: trees. Return the sum of each level from the root down.\n\nExample\nlevelSums([1, 2, 3]) returns [1, 5].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "range-tree-sum",
    "difficulty": "easy",
    "title": "Range tree sum",
    "prompt": "Range tree sum\n\nWrite `rangeTreeSum(level: (number | null)[], low: number, high: number): number`.\n\nTopic: trees. The tree is a binary search tree. Sum the values inside the inclusive range.\n\nExample\nrangeTreeSum([10, 5, 15, 3, 7, null, 18], 7, 15) returns 32.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "left-leaves",
    "difficulty": "easy",
    "title": "Left leaves",
    "prompt": "Left leaves\n\nWrite `leftLeaves(level: (number | null)[]): number`.\n\nTopic: trees. Return the sum of leaves that are left children.\n\nExample\nleftLeaves([3, 9, 20, null, null, 15, 7]) returns 24.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "node-count",
    "difficulty": "easy",
    "title": "Node count",
    "prompt": "Node count\n\nWrite `nodeCount(level: (number | null)[]): number`.\n\nTopic: trees. Return how many nodes the tree holds.\n\nExample\nnodeCount([1, 2, 3, 4]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "mountain-peak",
    "difficulty": "easy",
    "title": "Mountain peak",
    "prompt": "Mountain peak\n\nWrite `mountainPeak(heights: number[]): number`.\n\nTopic: binary search. The heights rise strictly and then fall strictly. Return the peak index.\n\nExample\nmountainPeak([0, 2, 1, 0]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "insert-index",
    "difficulty": "easy",
    "title": "Insert index",
    "prompt": "Insert index\n\nWrite `insertIndex(values: number[], target: number): number`.\n\nTopic: binary search. values is sorted. Return the index of target or where it should be inserted.\n\nExample\ninsertIndex([1, 3, 5, 6], 5) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "first-bad-build",
    "difficulty": "easy",
    "title": "First bad build",
    "prompt": "First bad build\n\nWrite `firstBadBuild(builds: number, badAt: number): number`.\n\nTopic: binary search. Builds 1 through builds are bad from badAt onward. Return the first bad build.\n\nExample\nfirstBadBuild(5, 4) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "last-stone",
    "difficulty": "easy",
    "title": "Last stone",
    "prompt": "Last stone\n\nWrite `lastStone(weights: number[]): number`.\n\nTopic: heaps. Smash the two heaviest stones and put back a positive difference. Return the last weight, or 0.\n\nExample\nlastStone([2, 7, 4, 1, 8, 1]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "subset-count",
    "difficulty": "easy",
    "title": "Subset count",
    "prompt": "Subset count\n\nWrite `subsetCount(n: number): number`.\n\nTopic: combinatorics. Return how many subsets a set of n distinct items has, including the empty set.\n\nExample\nsubsetCount(4) returns 16.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "order-count",
    "difficulty": "easy",
    "title": "Order count",
    "prompt": "Order count\n\nWrite `orderCount(n: number): number`.\n\nTopic: combinatorics. Return how many orders n distinct items have. Zero items have one empty order. n is at most 10.\n\nExample\norderCount(4) returns 24.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "ransom-note",
    "difficulty": "easy",
    "title": "Ransom note",
    "prompt": "Ransom note\n\nWrite `canWriteNote(note: string, magazine: string): boolean`.\n\nTopic: hashing. Return whether magazine can supply every letter of note, counting repeats. Case matters.\n\nExample\ncanWriteNote('aa', 'aab') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "same-letters",
    "difficulty": "easy",
    "title": "Same letters",
    "prompt": "Same letters\n\nWrite `sameLetters(a: string, b: string): boolean`.\n\nTopic: hashing. Return whether the strings are anagrams.\n\nExample\nsameLetters('anagram', 'nagaram') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "fib-index",
    "difficulty": "easy",
    "title": "Fibonacci index",
    "prompt": "Fibonacci index\n\nWrite `fibIndex(n: number): number`.\n\nTopic: dynamic programming. F(0)=0, F(1)=1, and later terms add the previous two. Return F(n).\n\nExample\nfibIndex(7) returns 13.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "trib-index",
    "difficulty": "easy",
    "title": "Tribonacci index",
    "prompt": "Tribonacci index\n\nWrite `tribIndex(n: number): number`.\n\nTopic: dynamic programming. T(0)=0, T(1)=T(2)=1, and later terms add the previous three. Return T(n).\n\nExample\ntribIndex(5) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pascal-row",
    "difficulty": "easy",
    "title": "Pascal row",
    "prompt": "Pascal row\n\nWrite `pascalRow(index: number): number[]`.\n\nTopic: math. Return row index of Pascal's triangle. Row 0 is [1].\n\nExample\npascalRow(3) returns [1, 3, 3, 1].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "digit-root",
    "difficulty": "easy",
    "title": "Digit root",
    "prompt": "Digit root\n\nWrite `digitRoot(n: number): number`.\n\nTopic: math. Sum digits repeatedly until one digit remains. Return it.\n\nExample\ndigitRoot(38) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "ugly-number",
    "difficulty": "easy",
    "title": "Ugly number",
    "prompt": "Ugly number\n\nWrite `isUgly(n: number): boolean`.\n\nTopic: math. A positive ugly number's prime factors are only 2, 3, and 5. Return whether n is ugly.\n\nExample\nisUgly(6) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "power-of-three",
    "difficulty": "easy",
    "title": "Power of three",
    "prompt": "Power of three\n\nWrite `isPowerOfThree(n: number): boolean`.\n\nTopic: math. Return whether n is 3 raised to a non-negative integer.\n\nExample\nisPowerOfThree(27) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "power-of-four",
    "difficulty": "easy",
    "title": "Power of four",
    "prompt": "Power of four\n\nWrite `isPowerOfFour(n: number): boolean`.\n\nTopic: bits. Return whether n is 4 raised to a non-negative integer.\n\nExample\nisPowerOfFour(16) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "same-shape",
    "difficulty": "easy",
    "title": "Same shape",
    "prompt": "Same shape\n\nWrite `sameShape(a: string, b: string): boolean`.\n\nTopic: hashing. Return whether a one-to-one letter map turns a into b.\n\nExample\nsameShape('paper', 'title') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "word-pattern",
    "difficulty": "easy",
    "title": "Word pattern",
    "prompt": "Word pattern\n\nWrite `matchesWordPattern(pattern: string, sentence: string): boolean`.\n\nTopic: hashing. Map each pattern letter to one word and each word to one letter. Return whether that rebuilds the sentence.\n\nExample\nmatchesWordPattern('abba', 'dog cat cat dog') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "longest-pal-build",
    "difficulty": "easy",
    "title": "Longest palindrome you can build",
    "prompt": "Longest palindrome you can build\n\nWrite `longestPalBuild(letters: string): number`.\n\nTopic: hashing. Using each letter at most as often as it appears, return the longest palindrome length you can build.\n\nExample\nlongestPalBuild('abccccdd') returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "first-single",
    "difficulty": "easy",
    "title": "First single letter",
    "prompt": "First single letter\n\nWrite `firstSingle(text: string): number`.\n\nTopic: hashing. Return the index of the first letter that appears once, or -1.\n\nExample\nfirstSingle('stress') returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "find-marker",
    "difficulty": "easy",
    "title": "Find the marker",
    "prompt": "Find the marker\n\nWrite `findMarker(log: string, marker: string): number`.\n\nTopic: strings. Return the first index of marker in log, or -1.\n\nExample\nfindMarker('hello', 'll') returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "last-token",
    "difficulty": "easy",
    "title": "Last token",
    "prompt": "Last token\n\nWrite `lastTokenLength(text: string): number`.\n\nTopic: strings. Return the length of the last word. text contains at least one word.\n\nExample\nlastTokenLength('dock lights on') returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "swap-vowels",
    "difficulty": "easy",
    "title": "Swap vowels",
    "prompt": "Swap vowels\n\nWrite `swapVowels(text: string): string`.\n\nTopic: two pointers. Reverse only the vowels. Other characters stay.\n\nExample\nswapVowels('hello') returns \"holle\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "keeps-order",
    "difficulty": "easy",
    "title": "Keeps order",
    "prompt": "Keeps order\n\nWrite `keepsOrder(needle: string, hay: string): boolean`.\n\nTopic: two pointers. Return whether needle is a subsequence of hay.\n\nExample\nkeepsOrder('abc', 'ahbgdc') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shared-counts",
    "difficulty": "easy",
    "title": "Shared counts",
    "prompt": "Shared counts\n\nWrite `sharedCounts(a: number[], b: number[]): number[]`.\n\nTopic: hashing. Return values present in both arrays, repeating a value min(countA, countB) times, sorted ascending.\n\nExample\nsharedCounts([1, 2, 2, 1], [2, 2]) returns [2, 2].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "third-distinct",
    "difficulty": "easy",
    "title": "Third distinct max",
    "prompt": "Third distinct max\n\nWrite `thirdDistinct(values: number[]): number`.\n\nTopic: sorting. Return the third largest distinct value, or the largest if fewer than three distinct values exist.\n\nExample\nthirdDistinct([3, 2, 3, 1, 2, 4]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "range-labels",
    "difficulty": "easy",
    "title": "Range labels",
    "prompt": "Range labels\n\nWrite `rangeLabels(values: number[]): string[]`.\n\nTopic: arrays. values is a sorted list of unique integers. Collapse each contiguous run to start->end, or a single number.\n\nExample\nrangeLabels([0, 1, 2, 4, 5, 7]) returns [\"0->2\", \"4->5\", \"7\"].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "plot-perimeter",
    "difficulty": "easy",
    "title": "Plot perimeter",
    "prompt": "Plot perimeter\n\nWrite `plotPerimeter(grid: number[][]): number`.\n\nTopic: grids. 1 is land. Return the perimeter.\n\nExample\nplotPerimeter([[0, 1, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]]) returns 16.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "longest-ones",
    "difficulty": "easy",
    "title": "Longest ones",
    "prompt": "Longest ones\n\nWrite `longestOnes(bits: number[]): number`.\n\nTopic: arrays. Return the longest contiguous run of 1s.\n\nExample\nlongestOnes([1, 1, 0, 1, 1, 1]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "extra-letter",
    "difficulty": "easy",
    "title": "Extra letter",
    "prompt": "Extra letter\n\nWrite `extraLetter(source: string, built: string): string`.\n\nTopic: bits. built is source plus one extra letter, shuffled. Return that letter.\n\nExample\nextraLetter('abcd', 'abcde') returns \"e\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "plant-gaps",
    "difficulty": "easy",
    "title": "Plant the gaps",
    "prompt": "Plant the gaps\n\nWrite `canPlant(bed: number[], flowers: number): boolean`.\n\nTopic: greedy. 1 is planted. New flowers cannot touch another flower. Return whether that many fit.\n\nExample\ncanPlant([1, 0, 0, 0, 1], 1) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "best-window-average",
    "difficulty": "easy",
    "title": "Best window average",
    "prompt": "Best window average\n\nWrite `bestWindowAverage(values: number[], k: number): number`.\n\nTopic: sliding window. Return the largest average of a window of length k.\n\nExample\nbestWindowAverage([1, 12, -5, -6, 50, 3], 4) returns 12.75.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "missing-from-span",
    "difficulty": "easy",
    "title": "Missing from the span",
    "prompt": "Missing from the span\n\nWrite `missingFromSpan(ids: number[]): number[]`.\n\nTopic: arrays. The list has length n and values from 1 through n, with repeats. Return the missing values in order.\n\nExample\nmissingFromSpan([4, 3, 2, 7, 8, 2, 3, 1]) returns [5, 6].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "dup-and-gap",
    "difficulty": "easy",
    "title": "Duplicate and gap",
    "prompt": "Duplicate and gap\n\nWrite `duplicateAndGap(ids: number[]): [number, number]`.\n\nTopic: math. The list should be 1 through n, but one value is duplicated and one is missing. Return [duplicate, missing].\n\nExample\nduplicateAndGap([1, 2, 2, 4]) returns [2, 3].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "hottest-span",
    "difficulty": "easy",
    "title": "Hottest span",
    "prompt": "Hottest span\n\nWrite `hottestSpan(values: number[]): number`.\n\nTopic: hashing. The degree is the highest frequency. Return the shortest slice that still has that degree.\n\nExample\nhottestSpan([1, 2, 2, 3, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rising-stretch",
    "difficulty": "easy",
    "title": "Rising stretch",
    "prompt": "Rising stretch\n\nWrite `risingStretch(values: number[]): number`.\n\nTopic: arrays. Return the longest strictly increasing contiguous stretch.\n\nExample\nrisingStretch([1, 3, 5, 4, 7]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "inning-points",
    "difficulty": "easy",
    "title": "Inning points",
    "prompt": "Inning points\n\nWrite `inningPoints(ops: string[]): number`.\n\nTopic: stack. An integer records points. D doubles the previous record, + adds the previous two, and C cancels the previous record. Return the total that remains.\n\nExample\ninningPoints(['5', '2', 'C', 'D', '+']) returns 30.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "anagram-group-count",
    "difficulty": "easy",
    "title": "Anagram group count",
    "prompt": "Anagram group count\n\nWrite `anagramGroupCount(words: string[]): number`.\n\nTopic: hashing. Group words that use the same letters with the same counts. Return how many groups there are.\n\nExample\nanagramGroupCount(['eat','tea','tan','ate','nat','bat']) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "visit-rooms",
    "difficulty": "easy",
    "title": "Visit every room",
    "prompt": "Visit every room\n\nWrite `canVisitRooms(rooms: number[][]): boolean`.\n\nTopic: graphs. rooms[i] lists the keys inside room i. Start in room 0. Return whether every room can be entered.\n\nExample\ncanVisitRooms([[1],[2],[3],[]]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "divisor-game",
    "difficulty": "easy",
    "title": "Divisor game",
    "prompt": "Divisor game\n\nWrite `divisorGameWin(n: number): boolean`.\n\nTopic: games. Start with n. A move chooses 0 < x < n with n divisible by x and replaces n with n-x. The player who faces 0 loses? The player who cannot move loses. Both play optimally. Return whether the first player wins.\n\nExample\ndivisorGameWin(2) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "nim-stones",
    "difficulty": "easy",
    "title": "Nim stones",
    "prompt": "Nim stones\n\nWrite `nimWin(n: number): boolean`.\n\nTopic: games. A pile has n stones. A move takes 1, 2, or 3. The player who takes the last stone wins. Return whether the first player wins with optimal play.\n\nExample\nnimWin(4) returns false.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "reverse-brief",
    "difficulty": "easy",
    "title": "Reverse a brief",
    "prompt": "Reverse a brief\n\nWrite `reverseBrief(text: string): string`.\n\nTopic: strings. Split the brief on whitespace, drop empty pieces, and return the words in reverse order joined by a single space.\n\nExample\nreverseBrief('  the dock is clear  ') returns \"clear is dock the\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "brace-balance",
    "difficulty": "easy",
    "title": "Brace balance",
    "prompt": "Brace balance\n\nWrite `bracesBalanced(text: string): boolean`.\n\nTopic: stack. The text uses round, square, and curly braces. Return whether every opener has a matching closer in order. Other characters do not appear.\n\nExample\nbracesBalanced('([{}])') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "missing-badge",
    "difficulty": "easy",
    "title": "Missing badge number",
    "prompt": "Missing badge number\n\nWrite `missingBadge(numbers: number[]): number`.\n\nTopic: math. numbers holds every integer from 0 through n exactly once, except one missing value. Return the missing value.\n\nExample\nmissingBadge([3, 0, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "lone-sensor",
    "difficulty": "easy",
    "title": "Lone sensor",
    "prompt": "Lone sensor\n\nWrite `loneSensor(readings: number[]): number`.\n\nTopic: bits. Every reading appears twice except one. Return the reading that appears once.\n\nExample\nloneSensor([4, 1, 2, 1, 2]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "set-bit-count",
    "difficulty": "easy",
    "title": "Set bit count",
    "prompt": "Set bit count\n\nWrite `setBitCount(value: number): number`.\n\nTopic: bits. Return how many bits are 1 in the binary form of a non-negative integer.\n\nExample\nsetBitCount(11) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shift-zeros",
    "difficulty": "easy",
    "title": "Shift zeros",
    "prompt": "Shift zeros\n\nWrite `shiftZeros(values: number[]): number[]`.\n\nTopic: arrays. Move every zero to the end. Keep the order of the other values.\n\nExample\nshiftZeros([0, 1, 0, 3, 12]) returns [1, 3, 12, 0, 0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "increment-digits",
    "difficulty": "easy",
    "title": "Increment digits",
    "prompt": "Increment digits\n\nWrite `incrementDigits(digits: number[]): number[]`.\n\nTopic: arrays. digits is a non-negative integer without leading zeros, one digit per cell, unless the number is zero. Return the digits of that number plus one.\n\nExample\nincrementDigits([1, 2, 9]) returns [1, 3, 0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "last-token-length",
    "difficulty": "easy",
    "title": "Last token length",
    "prompt": "Last token length\n\nWrite `lastTokenLength(text: string): number`.\n\nTopic: strings. Return the length of the last whitespace-separated token. An empty or blank string returns 0.\n\nExample\nlastTokenLength('yard gate open') returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "majority-shift",
    "difficulty": "easy",
    "title": "Majority shift",
    "prompt": "Majority shift\n\nWrite `majorityShift(ids: number[]): number`.\n\nTopic: voting. One id appears more than half the time. Return it.\n\nExample\nmajorityShift([2, 2, 1, 1, 1, 2, 2]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "duplicate-scan",
    "difficulty": "easy",
    "title": "Duplicate scan",
    "prompt": "Duplicate scan\n\nWrite `hasDuplicate(ids: number[]): boolean`.\n\nTopic: hashing. Return whether any id appears more than once.\n\nExample\nhasDuplicate([1, 2, 3, 1]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shared-skus",
    "difficulty": "easy",
    "title": "Shared SKUs",
    "prompt": "Shared SKUs\n\nWrite `sharedSkus(left: number[], right: number[]): number[]`.\n\nTopic: sets. Return the values that appear in both lists, each once, sorted ascending.\n\nExample\nsharedSkus([1, 2, 2, 1], [2, 2]) returns [2].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "calm-meter",
    "difficulty": "easy",
    "title": "Calm meter",
    "prompt": "Calm meter\n\nWrite `reachesOne(start: number): boolean`.\n\nTopic: math. Replace a positive integer by the sum of the squares of its digits. Return whether you reach 1.\n\nExample\nreachesOne(19) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "same-pattern",
    "difficulty": "easy",
    "title": "Same pattern",
    "prompt": "Same pattern\n\nWrite `samePattern(left: string, right: string): boolean`.\n\nTopic: hashing. Return whether the two strings follow the same character pattern. A character maps to exactly one character in the other string.\n\nExample\nsamePattern('paper', 'title') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "note-from-scrap",
    "difficulty": "easy",
    "title": "Note from scrap",
    "prompt": "Note from scrap\n\nWrite `canBuildNote(note: string, scrap: string): boolean`.\n\nTopic: counting. Return whether scrap has at least as many of each letter as note. Case matters. Spaces are letters too if present.\n\nExample\ncanBuildNote('aa', 'aab') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "first-solo-index",
    "difficulty": "easy",
    "title": "First solo index",
    "prompt": "First solo index\n\nWrite `firstSoloIndex(text: string): number`.\n\nTopic: counting. Return the index of the first character that appears once. Return -1 if every character repeats.\n\nExample\nfirstSoloIndex('stress') returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "mirror-number",
    "difficulty": "easy",
    "title": "Mirror number",
    "prompt": "Mirror number\n\nWrite `isMirrorNumber(value: number): boolean`.\n\nTopic: math. Return whether the decimal form reads the same forward and backward. Negative values are not mirrors.\n\nExample\nisMirrorNumber(121) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "floor-root",
    "difficulty": "easy",
    "title": "Floor root",
    "prompt": "Floor root\n\nWrite `floorRoot(value: number): number`.\n\nTopic: binary search. Return the greatest integer whose square is at most value. value is non-negative.\n\nExample\nfloorRoot(8) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "sheet-column",
    "difficulty": "easy",
    "title": "Sheet column number",
    "prompt": "Sheet column number\n\nWrite `sheetColumn(label: string): number`.\n\nTopic: math. Column labels use A as 1, Z as 26, and AA as 27. Return the number for an uppercase label.\n\nExample\nsheetColumn('ZY') returns 701.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "binary-sum",
    "difficulty": "easy",
    "title": "Binary sum",
    "prompt": "Binary sum\n\nWrite `binarySum(left: string, right: string): string`.\n\nTopic: math. Both strings are binary numerals without a leading zero unless the value is zero. Return their sum as a binary string.\n\nExample\nbinarySum('1010', '1011') returns \"10101\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "phrase-mirror",
    "difficulty": "easy",
    "title": "Phrase mirror",
    "prompt": "Phrase mirror\n\nWrite `isPhraseMirror(text: string): boolean`.\n\nTopic: strings. Ignore case and characters that are not letters or digits. Return whether the rest reads the same forward and backward.\n\nExample\nisPhraseMirror('A man, a plan, a canal: Panama') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "needle-index",
    "difficulty": "easy",
    "title": "Needle index",
    "prompt": "Needle index\n\nWrite `needleIndex(haystack: string, needle: string): number`.\n\nTopic: strings. Return the first index of needle in haystack, or -1. An empty needle returns 0.\n\nExample\nneedleIndex('sadbutsad', 'sad') returns 0.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "compact-sorted",
    "difficulty": "easy",
    "title": "Compact a sorted list",
    "prompt": "Compact a sorted list\n\nWrite `compactSorted(values: number[]): number`.\n\nTopic: two pointers. values is sorted. Pack unique values at the front, keeping order. Return how many unique values were packed. You may overwrite the input.\n\nExample\ncompactSorted([1, 1, 2]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "merge-two-sorted",
    "difficulty": "easy",
    "title": "Merge two sorted lists",
    "prompt": "Merge two sorted lists\n\nWrite `mergeSorted(left: number[], right: number[]): number[]`.\n\nTopic: two pointers. Both lists are sorted ascending. Return one sorted list.\n\nExample\nmergeSorted([1, 3, 5], [2, 4]) returns [1, 2, 3, 4, 5].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "one-sale",
    "difficulty": "easy",
    "title": "One sale",
    "prompt": "One sale\n\nWrite `oneSale(prices: number[]): number`.\n\nTopic: arrays. prices[i] is the price on day i. You may buy once and sell once later. Return the greatest profit, or 0 if no sale helps.\n\nExample\noneSale([7, 1, 5, 3, 6, 4]) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "best-slice-sum",
    "difficulty": "easy",
    "title": "Best slice sum",
    "prompt": "Best slice sum\n\nWrite `bestSliceSum(values: number[]): number`.\n\nTopic: DP. Return the greatest sum of a non-empty contiguous slice.\n\nExample\nbestSliceSum([-2, 1, -3, 4, -1, 2, 1, -5, 4]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "keypad-count",
    "difficulty": "easy",
    "title": "Keypad count",
    "prompt": "Keypad count\n\nWrite `keypadCount(digits: string): number`.\n\nTopic: recursion. Digits 2 through 9 map to the usual phone letters. Return how many strings those digits can spell. An empty digit string returns 0.\n\nExample\nkeypadCount('23') returns 9.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "kth-sorted",
    "difficulty": "easy",
    "title": "Kth in sorted order",
    "prompt": "Kth in sorted order\n\nWrite `kthSorted(values: number[], k: number): number`.\n\nTopic: sorting. values come from an in-order walk of a binary search tree, so they may be unsorted in this list. Return the kth smallest, counting from 1.\n\nExample\nkthSorted([3, 1, 4, 2], 1) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rotate-right",
    "difficulty": "easy",
    "title": "Rotate right",
    "prompt": "Rotate right\n\nWrite `rotateRight(values: number[], steps: number): number[]`.\n\nTopic: arrays. Rotate the list to the right by steps places. steps may be larger than the length.\n\nExample\nrotateRight([1, 2, 3, 4, 5], 2) returns [4, 5, 1, 2, 3].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "dup-and-missing",
    "difficulty": "easy",
    "title": "Duplicate and missing",
    "prompt": "Duplicate and missing\n\nWrite `duplicateAndMissing(values: number[]): [number, number]`.\n\nTopic: hashing. values should be 1 through n, but one number repeats and one is missing. Return [duplicate, missing].\n\nExample\nduplicateAndMissing([1, 2, 2, 4]) returns [2, 3].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "absent-ids",
    "difficulty": "easy",
    "title": "Absent ids",
    "prompt": "Absent ids\n\nWrite `absentIds(values: number[]): number[]`.\n\nTopic: arrays. values holds n integers from 1 through n, with duplicates allowed. Return the missing numbers from that range, sorted.\n\nExample\nabsentIds([4, 3, 2, 7, 8, 2, 3, 1]) returns [5, 6].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-fib",
    "difficulty": "easy",
    "title": "Dock fibonacci",
    "prompt": "Dock fibonacci\n\nWrite `dockFibonacci(n: number): number`.\n\nTopic: DP. Return the nth Fibonacci number with F(0) = 0 and F(1) = 1.\n\nExample\ndockFibonacci(7) returns 13.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-trib",
    "difficulty": "easy",
    "title": "Triple step total",
    "prompt": "Triple step total\n\nWrite `tripleStep(n: number): number`.\n\nTopic: DP. T(0) = 0, T(1) = 1, T(2) = 1, and each later term is the sum of the previous three. Return T(n).\n\nExample\ntripleStep(5) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-climb-cost",
    "difficulty": "easy",
    "title": "Cheapest climb",
    "prompt": "Cheapest climb\n\nWrite `cheapestClimb(cost: number[]): number`.\n\nTopic: DP. cost[i] is paid when you step on stair i. From a stair you may climb one or two stairs. You may start at stair 0 or 1. You finish after passing the last stair. Return the cheapest cost.\n\nExample\ncheapestClimb([10, 15, 20]) returns 15.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-choose",
    "difficulty": "easy",
    "title": "Ways to choose",
    "prompt": "Ways to choose\n\nWrite `waysToChoose(n: number, k: number): number`.\n\nTopic: DP. Return how many ways to choose k items from n distinct items.\n\nExample\nwaysToChoose(5, 2) returns 10.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-sorted-vowels",
    "difficulty": "easy",
    "title": "Nondecreasing vowels",
    "prompt": "Nondecreasing vowels\n\nWrite `nondecreasingVowels(length: number): number`.\n\nTopic: combinatorics. Count length strings from a e i o u that are sorted nondecreasing.\n\nExample\nnondecreasingVowels(2) returns 15.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-digit-product",
    "difficulty": "easy",
    "title": "Decimal product",
    "prompt": "Decimal product\n\nWrite `decimalProduct(left: string, right: string): string`.\n\nTopic: math. Return the product of two non-negative decimal strings.\n\nExample\ndecimalProduct('12', '12') returns \"144\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-town-judge",
    "difficulty": "easy",
    "title": "Trusted by all",
    "prompt": "Trusted by all\n\nWrite `trustedByAll(people: number, trust: [number, number][]): number`.\n\nTopic: graphs. The judge trusts nobody and is trusted by everyone else. Return that person, or -1.\n\nExample\ntrustedByAll(3, [[1,3],[2,3]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-last-stone",
    "difficulty": "easy",
    "title": "Last stone weight",
    "prompt": "Last stone weight\n\nWrite `lastStoneWeight(stones: number[]): number`.\n\nTopic: heaps. Repeatedly smash the two heaviest. Return what remains, or 0.\n\nExample\nlastStoneWeight([2,7,4,1,8,1]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-flowers",
    "difficulty": "easy",
    "title": "Flower gaps",
    "prompt": "Flower gaps\n\nWrite `flowersFit(bed: number[], needed: number): boolean`.\n\nTopic: greedy. Empty plots need empty neighbors. Return whether needed new flowers fit.\n\nExample\nflowersFit([1,0,0,0,1], 1) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-nondec",
    "difficulty": "easy",
    "title": "One change keeps order",
    "prompt": "One change keeps order\n\nWrite `oneChangeKeepsOrder(values: number[]): boolean`.\n\nTopic: arrays. Change at most one value. Return whether the list can be nondecreasing.\n\nExample\noneChangeKeepsOrder([4, 2, 3]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-poison",
    "difficulty": "easy",
    "title": "Active poison seconds",
    "prompt": "Active poison seconds\n\nWrite `activePoisonSeconds(times: number[], duration: number): number`.\n\nTopic: arrays. A sting lasts duration seconds and resets. Return the covered seconds.\n\nExample\nactivePoisonSeconds([1, 4], 2) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-degree",
    "difficulty": "easy",
    "title": "Shortest high-frequency slice",
    "prompt": "Shortest high-frequency slice\n\nWrite `shortestHighFrequencySlice(values: number[]): number`.\n\nTopic: hashing. Return the shortest slice whose most frequent value matches the array degree.\n\nExample\nshortestHighFrequencySlice([1, 2, 2, 3, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-freq",
    "difficulty": "easy",
    "title": "Sort by frequency",
    "prompt": "Sort by frequency\n\nWrite `sortByFrequency(text: string): string`.\n\nTopic: sorting. Sort characters by descending count, then by character.\n\nExample\nsortByFrequency('tree') returns \"eert\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-alien",
    "difficulty": "easy",
    "title": "Sorted in a new alphabet",
    "prompt": "Sorted in a new alphabet\n\nWrite `sortedInAlphabet(words: string[], order: string): boolean`.\n\nTopic: sorting. order is a full lowercase alphabet. Return whether words are already sorted.\n\nExample\nsortedInAlphabet(['hello', 'recruit'], 'hlabcdefgijkmnopqrstuvwxyz') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-extra",
    "difficulty": "easy",
    "title": "Added character",
    "prompt": "Added character\n\nWrite `addedCharacter(shorter: string, longer: string): string`.\n\nTopic: bits. longer is shorter shuffled with one extra character. Return it.\n\nExample\naddedCharacter('abcd', 'abcde') returns \"e\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-pal-len",
    "difficulty": "easy",
    "title": "Build a palindrome",
    "prompt": "Build a palindrome\n\nWrite `buildPalindromeLength(letters: string): number`.\n\nTopic: counting. Return the longest palindrome length you can build. Leftover letters may be dropped, except one center.\n\nExample\nbuildPalindromeLength('abccccdd') returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-subseq",
    "difficulty": "easy",
    "title": "Subsequence check",
    "prompt": "Subsequence check\n\nWrite `isOrderedSubsequence(needle: string, text: string): boolean`.\n\nTopic: two pointers. Return whether needle can be formed by deleting characters from text.\n\nExample\nisOrderedSubsequence('abc', 'ahbgdc') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-groups",
    "difficulty": "easy",
    "title": "Equal binary runs",
    "prompt": "Equal binary runs\n\nWrite `equalBinaryRuns(text: string): number`.\n\nTopic: strings. Count substrings made of one run of 0s and one run of 1s of equal length.\n\nExample\nequalBinaryRuns('00110011') returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-repeat",
    "difficulty": "easy",
    "title": "Repeated block",
    "prompt": "Repeated block\n\nWrite `isRepeatedBlock(text: string): boolean`.\n\nTopic: strings. Return whether text repeats a shorter block at least twice.\n\nExample\nisRepeatedBlock('abab') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-rotation",
    "difficulty": "easy",
    "title": "Is a rotation",
    "prompt": "Is a rotation\n\nWrite `isARotation(text: string, goal: string): boolean`.\n\nTopic: strings. Return whether goal is text rotated.\n\nExample\nisARotation('abcde', 'cdeab') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-common",
    "difficulty": "easy",
    "title": "Most used word",
    "prompt": "Most used word\n\nWrite `mostUsedWord(paragraph: string, banned: string[]): string`.\n\nTopic: hashing. Ignore case and banned words. Return the unique most common word.\n\nExample\nmostUsedWord('Bob hit a ball, the hit BALL flew far after it was hit.', ['hit']) returns \"ball\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-nearest",
    "difficulty": "easy",
    "title": "Distance to a mark",
    "prompt": "Distance to a mark\n\nWrite `distanceToMark(text: string, mark: string): number[]`.\n\nTopic: arrays. mark is one character that occurs. Return the distance from each index to the nearest mark.\n\nExample\ndistanceToMark('bookkeeper', 'e') returns [5, 4, 3, 2, 1, 0, 0, 1, 0, 1].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-row",
    "difficulty": "easy",
    "title": "Single keyboard row",
    "prompt": "Single keyboard row\n\nWrite `singleKeyboardRow(words: string[]): string[]`.\n\nTopic: sets. Keep words typed on one QWERTY row. Ignore case and keep order.\n\nExample\nsingleKeyboardRow(['Hello', 'Alaska', 'Dad', 'Peace']) returns [\"Alaska\", \"Dad\"].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-caps",
    "difficulty": "easy",
    "title": "Capital pattern",
    "prompt": "Capital pattern\n\nWrite `capitalPatternOk(word: string): boolean`.\n\nTopic: strings. Accept all caps, all lowercase, or a single leading capital.\n\nExample\ncapitalPatternOk('Recruit') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-flip",
    "difficulty": "easy",
    "title": "Reverse each token",
    "prompt": "Reverse each token\n\nWrite `reverseEachToken(text: string): string`.\n\nTopic: strings. Reverse every token. Preserve the spaces, including repeated spaces.\n\nExample\nreverseEachToken('Let us go') returns \"teL su og\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-decimal",
    "difficulty": "easy",
    "title": "Add decimal strings",
    "prompt": "Add decimal strings\n\nWrite `addDecimalStrings(left: string, right: string): string`.\n\nTopic: math. Add two non-negative decimal strings.\n\nExample\naddDecimalStrings('11', '123') returns \"134\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-moves",
    "difficulty": "easy",
    "title": "Increments to equal",
    "prompt": "Increments to equal\n\nWrite `incrementsToEqual(values: number[]): number`.\n\nTopic: math. A move increments every value but one. Return the fewest moves that equalize the list.\n\nExample\nincrementsToEqual([1, 2, 3]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "best-product-run",
    "difficulty": "medium",
    "title": "Best product run",
    "prompt": "Best product run\n\nWrite `bestProductRun(values: number[]): number`.\n\nTopic: arrays, dynamic programming. Return the largest product of any contiguous run. Values may be negative, and a run has at least one value.\n\nExample\nbestProductRun([2, 3, -2, 4]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "circular-run",
    "difficulty": "medium",
    "title": "Circular shift run",
    "prompt": "Circular shift run\n\nWrite `circularRun(values: number[]): number`.\n\nTopic: arrays. The line is circular, so a run may wrap once. Do not reuse a value. Return the largest contiguous sum.\n\nExample\ncircularRun([5, -3, 5]) returns 10.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "closest-trio",
    "difficulty": "medium",
    "title": "Closest trio",
    "prompt": "Closest trio\n\nWrite `closestTrio(weights: number[], target: number): number`.\n\nTopic: two pointers. Return the sum of three different values that is closest to target.\n\nExample\nclosestTrio([-1, 2, 1, -4], 1) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "trio-count",
    "difficulty": "medium",
    "title": "Trio count",
    "prompt": "Trio count\n\nWrite `trioCount(weights: number[], target: number): number`.\n\nTopic: two pointers. Count unordered triples of distinct indexes that add to target. Identical value multisets count once.\n\nExample\ntrioCount([-1, 0, 1, 2, -1, -4], 0) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pier-span",
    "difficulty": "medium",
    "title": "Pier span",
    "prompt": "Pier span\n\nWrite `pierSpan(heights: number[]): number`.\n\nTopic: two pointers. Choose two piers. The span is the shorter height times the index distance. Return the largest span.\n\nExample\npierSpan([1, 8, 6, 2, 5, 4, 8, 3, 7]) returns 49.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "nearby-almost",
    "difficulty": "medium",
    "title": "Nearby almost duplicate",
    "prompt": "Nearby almost duplicate\n\nWrite `nearbyAlmost(values: number[], indexLimit: number, valueLimit: number): boolean`.\n\nTopic: hashing. Return whether two indexes are at most indexLimit apart and their values differ by at most valueLimit.\n\nExample\nnearbyAlmost([1, 5, 9, 1, 5, 9], 2, 3) returns false.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "write-roman",
    "difficulty": "medium",
    "title": "Write a Roman numeral",
    "prompt": "Write a Roman numeral\n\nWrite `writeRoman(value: number): string`.\n\nTopic: greedy. value is from 1 to 3999. Return the standard Roman form, including pairs such as IV and CM.\n\nExample\nwriteRoman(1994) returns \"MCMXCIV\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "night-route",
    "difficulty": "medium",
    "title": "Night route",
    "prompt": "Night route\n\nWrite `nightRoute(loot: number[]): number`.\n\nTopic: dynamic programming. You cannot take two adjacent houses. Return the best sum.\n\nExample\nnightRoute([2, 7, 9, 3, 1]) returns 12.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "ring-route",
    "difficulty": "medium",
    "title": "Ring route",
    "prompt": "Ring route\n\nWrite `ringRoute(loot: number[]): number`.\n\nTopic: dynamic programming. Houses form a circle, so the first and last are adjacent. Return the best sum with no two chosen houses adjacent.\n\nExample\nringRoute([2, 3, 2]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "earn-or-delete",
    "difficulty": "medium",
    "title": "Earn or delete",
    "prompt": "Earn or delete\n\nWrite `earnOrDelete(values: number[]): number`.\n\nTopic: dynamic programming. Taking a value earns it and deletes every copy of the neighboring integers. Return the maximum earnings.\n\nExample\nearnOrDelete([3, 4, 2]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "fewest-stamps",
    "difficulty": "medium",
    "title": "Fewest stamps",
    "prompt": "Fewest stamps\n\nWrite `fewestStamps(stamps: number[], postage: number): number`.\n\nTopic: dynamic programming. Stamps may be reused. Return the fewest that sum to postage, or -1. Zero postage needs zero stamps.\n\nExample\nfewestStamps([1, 3, 4], 6) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "stamp-orders",
    "difficulty": "medium",
    "title": "Stamp combinations",
    "prompt": "Stamp combinations\n\nWrite `stampOrders(stamps: number[], postage: number): number`.\n\nTopic: dynamic programming. Count combinations, not permutations, of reusable stamps that sum to postage. Zero postage has one empty combination.\n\nExample\nstampOrders([1, 2, 5], 5) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "square-stamps",
    "difficulty": "medium",
    "title": "Square stamps",
    "prompt": "Square stamps\n\nWrite `squareStamps(n: number): number`.\n\nTopic: dynamic programming. Each stamp covers a positive perfect square. Return the fewest stamps that cover exactly n.\n\nExample\nsquareStamps(12) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "break-integer",
    "difficulty": "medium",
    "title": "Break an integer",
    "prompt": "Break an integer\n\nWrite `breakInteger(n: number): number`.\n\nTopic: dynamic programming. Split n into at least two positive integers and return the maximum product of the parts.\n\nExample\nbreakInteger(10) returns 36.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "search-tree-count",
    "difficulty": "medium",
    "title": "Search tree count",
    "prompt": "Search tree count\n\nWrite `searchTreeCount(n: number): number`.\n\nTopic: dynamic programming, trees. Count binary search tree shapes on keys 1 through n.\n\nExample\nsearchTreeCount(3) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rising-chain",
    "difficulty": "medium",
    "title": "Rising chain",
    "prompt": "Rising chain\n\nWrite `risingChain(values: number[]): number`.\n\nTopic: dynamic programming. Return the length of the longest strictly increasing subsequence. It need not be contiguous.\n\nExample\nrisingChain([10, 9, 2, 5, 3, 7, 101, 18]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shared-letters",
    "difficulty": "medium",
    "title": "Shared letter run",
    "prompt": "Shared letter run\n\nWrite `sharedRun(a: string, b: string): number`.\n\nTopic: dynamic programming. Return the length of the longest common subsequence. Order is kept; letters need not be contiguous.\n\nExample\nsharedRun('abcde', 'ace') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shared-slice",
    "difficulty": "medium",
    "title": "Shared slice",
    "prompt": "Shared slice\n\nWrite `sharedSlice(a: string, b: string): number`.\n\nTopic: dynamic programming. Return the length of the longest shared contiguous substring.\n\nExample\nsharedSlice('bluefish', 'goldfish') returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "edit-steps",
    "difficulty": "medium",
    "title": "Edit steps",
    "prompt": "Edit steps\n\nWrite `editSteps(a: string, b: string): number`.\n\nTopic: dynamic programming. Return the fewest insertions, deletions, and substitutions that turn a into b.\n\nExample\neditSteps('kitten', 'sitting') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "council-ids",
    "difficulty": "medium",
    "title": "Council ids",
    "prompt": "Council ids\n\nWrite `councilIds(ids: number[]): number[]`.\n\nTopic: voting. Return every id that occurs more than length/3 times, sorted ascending.\n\nExample\ncouncilIds([3, 2, 3]) returns [3].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "lone-triple",
    "difficulty": "medium",
    "title": "Lone among triples",
    "prompt": "Lone among triples\n\nWrite `loneAmongTriples(ids: number[]): number`.\n\nTopic: bits. Every id appears three times except one, which appears once. Return that id.\n\nExample\nloneAmongTriples([0, 1, 0, 1, 0, 1, 99]) returns 99.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "sum-slice-count",
    "difficulty": "medium",
    "title": "Slices that sum to K",
    "prompt": "Slices that sum to K\n\nWrite `sumSliceCount(values: number[], k: number): number`.\n\nTopic: prefix sums. Return how many contiguous slices add to k. Values may be negative.\n\nExample\nsumSliceCount([1, 1, 1], 2) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "divisible-slices",
    "difficulty": "medium",
    "title": "Divisible slices",
    "prompt": "Divisible slices\n\nWrite `divisibleSlices(values: number[], k: number): number`.\n\nTopic: prefix sums. Return how many contiguous slices have a sum divisible by the positive integer k.\n\nExample\ndivisibleSlices([4, 5, 0, -2, -3, 1], 5) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shortest-cover-sum",
    "difficulty": "medium",
    "title": "Shortest cover sum",
    "prompt": "Shortest cover sum\n\nWrite `shortestCoverSum(target: number, values: number[]): number`.\n\nTopic: sliding window. values are positive. Return the shortest slice length that adds to at least target, or 0.\n\nExample\nshortestCoverSum(7, [2, 3, 1, 2, 4, 3]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "product-under",
    "difficulty": "medium",
    "title": "Product under K",
    "prompt": "Product under K\n\nWrite `productUnder(values: number[], k: number): number`.\n\nTopic: sliding window. values are positive. Count slices whose product is strictly under k.\n\nExample\nproductUnder([10, 5, 2, 6], 100) returns 8.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "at-most-k-codes",
    "difficulty": "medium",
    "title": "At most K codes",
    "prompt": "At most K codes\n\nWrite `atMostKCodes(signal: string, k: number): number`.\n\nTopic: sliding window. Return the longest substring that uses at most k distinct letters.\n\nExample\natMostKCodes('eceba', 2) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "replace-to-repeat",
    "difficulty": "medium",
    "title": "Replace to repeat",
    "prompt": "Replace to repeat\n\nWrite `replaceToRepeat(signal: string, budget: number): number`.\n\nTopic: sliding window. You may change at most budget letters. Return the longest run of one letter you can make.\n\nExample\nreplaceToRepeat('AABABBA', 1) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "holds-permutation",
    "difficulty": "medium",
    "title": "Holds a permutation",
    "prompt": "Holds a permutation\n\nWrite `holdsPermutation(pattern: string, text: string): boolean`.\n\nTopic: sliding window. Return whether any window of text is a rearrangement of pattern.\n\nExample\nholdsPermutation('ab', 'eidbaooo') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "anagram-starts",
    "difficulty": "medium",
    "title": "Anagram starts",
    "prompt": "Anagram starts\n\nWrite `anagramStarts(pattern: string, text: string): number[]`.\n\nTopic: sliding window. Return every start index whose window is a rearrangement of pattern.\n\nExample\nanagramStarts('abc', 'cbaebabacd') returns [0, 6].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "ones-with-flips",
    "difficulty": "medium",
    "title": "Ones with flips",
    "prompt": "Ones with flips\n\nWrite `onesWithFlips(bits: number[], budget: number): number`.\n\nTopic: sliding window. bits are 0 and 1. Flip at most budget zeros. Return the longest run of ones.\n\nExample\nonesWithFlips([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "binary-sum-k",
    "difficulty": "medium",
    "title": "Binary slices summing to K",
    "prompt": "Binary slices summing to K\n\nWrite `binarySumCount(bits: number[], k: number): number`.\n\nTopic: sliding window. bits are 0 and 1. Count slices that add to exactly k.\n\nExample\nbinarySumCount([1, 0, 1, 0, 1], 2) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "k-odd-slices",
    "difficulty": "medium",
    "title": "K odd slices",
    "prompt": "K odd slices\n\nWrite `kOddSlices(values: number[], k: number): number`.\n\nTopic: sliding window. Count slices that contain exactly k odd numbers.\n\nExample\nkOddSlices([1, 1, 2, 1, 1], 3) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "two-fruit-row",
    "difficulty": "medium",
    "title": "Two fruit row",
    "prompt": "Two fruit row\n\nWrite `twoFruitRow(trees: number[]): number`.\n\nTopic: sliding window. Pick a contiguous row using at most two fruit types. Return the most fruit.\n\nExample\ntwoFruitRow([1, 2, 1]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "insert-window",
    "difficulty": "medium",
    "title": "Insert a window",
    "prompt": "Insert a window\n\nWrite `insertWindow(windows: [number, number][], next: [number, number]): [number, number][]`.\n\nTopic: intervals. windows are sorted and disjoint, closed on both ends. Insert next and merge overlaps.\n\nExample\ninsertWindow([[1, 3], [6, 9]], [2, 5]) returns [[1, 5], [6, 9]].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "drop-overlaps",
    "difficulty": "medium",
    "title": "Drop overlaps",
    "prompt": "Drop overlaps\n\nWrite `dropOverlaps(windows: [number, number][]): number`.\n\nTopic: greedy. Each window is closed. Return how many to remove so the rest do not overlap, counting a shared endpoint as overlap.\n\nExample\ndropOverlaps([[1, 2], [2, 3], [3, 4], [1, 3]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shared-windows",
    "difficulty": "medium",
    "title": "Shared windows",
    "prompt": "Shared windows\n\nWrite `sharedWindows(a: [number, number][], b: [number, number][]): [number, number][]`.\n\nTopic: intervals. Both lists are sorted disjoint closed intervals. Return their intersection.\n\nExample\nsharedWindows([[0, 2], [5, 10]], [[1, 5], [8, 12]]) returns [[1, 2], [5, 5], [8, 10]].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "grid-routes-blocked",
    "difficulty": "medium",
    "title": "Grid routes with blocks",
    "prompt": "Grid routes with blocks\n\nWrite `gridRoutesBlocked(grid: number[][]): number`.\n\nTopic: dynamic programming. 1 is blocked. Count right-or-down paths from the top-left to the bottom-right.\n\nExample\ngridRoutesBlocked([[0, 0, 0], [0, 1, 0], [0, 0, 0]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cheapest-grid-path",
    "difficulty": "medium",
    "title": "Cheapest grid path",
    "prompt": "Cheapest grid path\n\nWrite `cheapestGridPath(grid: number[][]): number`.\n\nTopic: dynamic programming. Move only right or down. Cells are non-negative costs. Return the cheapest path.\n\nExample\ncheapestGridPath([[1, 3, 1], [1, 5, 1], [4, 2, 1]]) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "land-count",
    "difficulty": "medium",
    "title": "Land count",
    "prompt": "Land count\n\nWrite `landCount(grid: number[][]): number`.\n\nTopic: graphs. 1 is land. Edge-adjacent land is one island. Return the island count.\n\nExample\nlandCount([[1, 1, 0], [0, 1, 0], [0, 0, 1]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "largest-island",
    "difficulty": "medium",
    "title": "Largest island",
    "prompt": "Largest island\n\nWrite `largestIsland(grid: number[][]): number`.\n\nTopic: graphs. Return the area of the largest edge-connected island of 1s.\n\nExample\nlargestIsland([[0, 1], [1, 1]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "enclosed-lakes",
    "difficulty": "medium",
    "title": "Enclosed lakes",
    "prompt": "Enclosed lakes\n\nWrite `enclosedLakes(grid: number[][]): number`.\n\nTopic: graphs. 0 is water. Count water regions that do not touch the border.\n\nExample\nenclosedLakes([[1, 1, 1, 1], [1, 0, 0, 1], [1, 1, 0, 1], [1, 1, 1, 1]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rot-minutes",
    "difficulty": "medium",
    "title": "Rot minutes",
    "prompt": "Rot minutes\n\nWrite `rotMinutes(grid: number[][]): number`.\n\nTopic: BFS. 2 is rotten, 1 is fresh, 0 is empty. Rot spreads to edge neighbors each minute. Return the minutes until nothing fresh remains, or -1.\n\nExample\nrotMinutes([[2, 1, 1], [1, 1, 0], [0, 1, 1]]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "distance-sum",
    "difficulty": "medium",
    "title": "Corner distance to zero",
    "prompt": "Corner distance to zero\n\nWrite `cornerDistance(mat: number[][]): number`.\n\nTopic: BFS. mat holds 0 and 1. Return the distance from the top-left to the nearest 0 plus the distance from the bottom-right to the nearest 0.\n\nExample\ncornerDistance([[0, 0, 0], [0, 1, 0], [1, 1, 1]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "friend-circles",
    "difficulty": "medium",
    "title": "Friend circles",
    "prompt": "Friend circles\n\nWrite `friendCircles(people: number, edges: [number, number][]): number`.\n\nTopic: union-find. People are 0 through people-1. Undirected edges are friendships. Return the number of groups.\n\nExample\nfriendCircles(4, [[0, 1], [1, 2]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "extra-cable",
    "difficulty": "medium",
    "title": "Extra cable",
    "prompt": "Extra cable\n\nWrite `extraCable(n: number, edges: [number, number][]): [number, number]`.\n\nTopic: union-find. Nodes are 1 through n. One edge closes a cycle in what was a tree. Return that edge.\n\nExample\nextraCable(3, [[1, 2], [1, 3], [2, 3]]) returns [2, 3].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "two-teams",
    "difficulty": "medium",
    "title": "Two teams",
    "prompt": "Two teams\n\nWrite `twoTeams(people: number, edges: [number, number][]): boolean`.\n\nTopic: graphs. Return whether the undirected graph is bipartite.\n\nExample\ntwoTeams(4, [[0, 1], [0, 3], [1, 2], [2, 3]]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "can-finish-modules",
    "difficulty": "medium",
    "title": "Can finish the modules",
    "prompt": "Can finish the modules\n\nWrite `canFinishModules(n: number, edges: [number, number][]): boolean`.\n\nTopic: topological sort. Edge [before, after] means before is a prerequisite of after. Return whether every module can be ordered.\n\nExample\ncanFinishModules(2, [[1, 0]]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "signal-delay",
    "difficulty": "medium",
    "title": "Signal delay",
    "prompt": "Signal delay\n\nWrite `signalDelay(times: [number, number, number][], n: number, source: number): number`.\n\nTopic: shortest paths. Nodes are 1 through n. Each triple is a directed [from, to, minutes]. Return when every node has heard the signal from source, or -1.\n\nExample\nsignalDelay([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cheapest-fare",
    "difficulty": "medium",
    "title": "Cheapest fare",
    "prompt": "Cheapest fare\n\nWrite `cheapestFare(cities: number, flights: [number, number, number][], source: number, target: number, stops: number): number`.\n\nTopic: dynamic programming. Cities are 0 through cities-1. Return the cheapest price with at most stops layovers, or -1.\n\nExample\ncheapestFare(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1) returns 700.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "least-effort",
    "difficulty": "medium",
    "title": "Least effort path",
    "prompt": "Least effort path\n\nWrite `leastEffort(heights: number[][]): number`.\n\nTopic: graphs. A path's effort is its largest absolute height change. Return the minimum effort from the top-left to the bottom-right.\n\nExample\nleastEffort([[1, 2, 2], [3, 8, 2], [5, 3, 5]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "can-segment",
    "difficulty": "medium",
    "title": "Can segment",
    "prompt": "Can segment\n\nWrite `canSegment(text: string, words: string[]): boolean`.\n\nTopic: dynamic programming. Return whether text splits into dictionary words. Words may be reused.\n\nExample\ncanSegment('applepenapple', ['apple', 'pen']) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "trades-with-fee",
    "difficulty": "medium",
    "title": "Trades with a fee",
    "prompt": "Trades with a fee\n\nWrite `tradesWithFee(prices: number[], fee: number): number`.\n\nTopic: dynamic programming. Each completed sale pays fee. Hold at most one share. Return the best profit.\n\nExample\ntradesWithFee([1, 3, 2, 8, 4, 9], 2) returns 8.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "label-parts",
    "difficulty": "medium",
    "title": "Label parts",
    "prompt": "Label parts\n\nWrite `labelParts(label: string): number[]`.\n\nTopic: greedy. Split so each letter lives in only one part, using as many parts as possible. Return the part lengths.\n\nExample\nlabelParts('ababcbacadefegdehijhklij') returns [9, 7, 8].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cooldown-tasks",
    "difficulty": "medium",
    "title": "Task cooldown",
    "prompt": "Task cooldown\n\nWrite `taskCooldown(tasks: string[], gap: number): number`.\n\nTopic: greedy. The same letter needs at least gap other slots between runs. Idle slots are allowed. Return the shortest schedule.\n\nExample\ntaskCooldown(['A', 'A', 'A', 'B', 'B', 'B'], 2) returns 8.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rearrange-letters",
    "difficulty": "medium",
    "title": "Rearrange letters",
    "prompt": "Rearrange letters\n\nWrite `rearrangeLetters(text: string): string`.\n\nTopic: greedy. Rearrange so no two adjacent letters match. Return any valid string, or empty if impossible.\n\nExample\nrearrangeLetters('aab') returns \"aba\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "straight-hand",
    "difficulty": "medium",
    "title": "Straight hand",
    "prompt": "Straight hand\n\nWrite `straightHand(cards: number[], groupSize: number): boolean`.\n\nTopic: greedy. Return whether the cards split into groups of groupSize consecutive values.\n\nExample\nstraightHand([1, 2, 3, 6, 2, 3, 4, 7, 8], 3) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "fleet-count",
    "difficulty": "medium",
    "title": "Fleet count",
    "prompt": "Fleet count\n\nWrite `fleetCount(target: number, position: number[], speed: number[]): number`.\n\nTopic: stack. A faster car catches a slower car ahead and must match its speed. Return how many fleets arrive at target.\n\nExample\nfleetCount(12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "warmer-days",
    "difficulty": "medium",
    "title": "Warmer days",
    "prompt": "Warmer days\n\nWrite `warmerDays(temps: number[]): number[]`.\n\nTopic: stack. For each day return how many days until a strictly warmer temperature, or 0.\n\nExample\nwarmerDays([73, 74, 75, 71, 69, 72, 76, 73]) returns [1, 1, 4, 2, 1, 1, 0, 0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "circular-taller",
    "difficulty": "medium",
    "title": "Circular next taller",
    "prompt": "Circular next taller\n\nWrite `circularTaller(heights: number[]): number[]`.\n\nTopic: stack. The line wraps. Return the next strictly taller value, or -1.\n\nExample\ncircularTaller([1, 2, 1]) returns [2, -1, 2].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "asteroid-line",
    "difficulty": "medium",
    "title": "Asteroid line",
    "prompt": "Asteroid line\n\nWrite `asteroidLine(masses: number[]): number[]`.\n\nTopic: stack. Positive moves right, negative moves left. On a collision the smaller explodes and equals both explode. Return what remains.\n\nExample\nasteroidLine([5, 10, -5]) returns [5, 10].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "polish-value",
    "difficulty": "medium",
    "title": "Reverse Polish value",
    "prompt": "Reverse Polish value\n\nWrite `polishValue(tokens: string[]): number`.\n\nTopic: stack. Evaluate reverse Polish tokens. Division truncates toward zero.\n\nExample\npolishValue(['2', '1', '+', '3', '*']) returns 9.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "expand-pattern",
    "difficulty": "medium",
    "title": "Expand the pattern",
    "prompt": "Expand the pattern\n\nWrite `expandPattern(pattern: string): string`.\n\nTopic: stack. k[abc] repeats abc k times and patterns nest. Return the expansion.\n\nExample\nexpandPattern('3[a2[c]]') returns \"accaccacc\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "paren-score",
    "difficulty": "medium",
    "title": "Parenthesis score",
    "prompt": "Parenthesis score\n\nWrite `parenScore(text: string): number`.\n\nTopic: stack. () scores 1, concatenation adds, and wrapping doubles. text is valid. Return the score.\n\nExample\nparenScore('(()(()))') returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "min-bracket-edits",
    "difficulty": "medium",
    "title": "Minimum bracket edits",
    "prompt": "Minimum bracket edits\n\nWrite `minBracketEdits(text: string): string`.\n\nTopic: stack. Delete the fewest parentheses so the string is valid. Return any such string.\n\nExample\nminBracketEdits('lee(t(c)o)de)') returns \"lee(t(c)o)de\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "circuit-start",
    "difficulty": "medium",
    "title": "Circuit start",
    "prompt": "Circuit start\n\nWrite `circuitStart(gas: number[], cost: number[]): number`.\n\nTopic: greedy. gas[i] fills the tank and cost[i] is the fuel to the next station, wrapping around. Return the unique start that completes a circuit, or -1.\n\nExample\ncircuitStart([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "wiggle-length",
    "difficulty": "medium",
    "title": "Wiggle length",
    "prompt": "Wiggle length\n\nWrite `wiggleLength(values: number[]): number`.\n\nTopic: dynamic programming. A wiggle alternates up and down. Equals do not extend it. Return the longest wiggle subsequence.\n\nExample\nwiggleLength([1, 7, 4, 9, 2, 5]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rising-triple",
    "difficulty": "medium",
    "title": "Rising triple",
    "prompt": "Rising triple\n\nWrite `hasRisingTriple(values: number[]): boolean`.\n\nTopic: greedy. Return whether three increasing values appear in order, not necessarily contiguous.\n\nExample\nhasRisingTriple([1, 2, 3, 4, 5]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "fewest-jumps",
    "difficulty": "medium",
    "title": "Fewest jumps",
    "prompt": "Fewest jumps\n\nWrite `fewestJumps(jumps: number[]): number`.\n\nTopic: greedy. jumps[i] is how far you may leap from i. Return the fewest leaps from the first index to the last. The end is reachable.\n\nExample\nfewestJumps([2, 3, 1, 1, 4]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "can-reach-end",
    "difficulty": "medium",
    "title": "Can reach the end",
    "prompt": "Can reach the end\n\nWrite `canReachEnd(jumps: number[]): boolean`.\n\nTopic: greedy. Return whether the last index is reachable when jumps[i] is the farthest leap from i.\n\nExample\ncanReachEnd([2, 3, 1, 1, 4]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "search-tree-ok",
    "difficulty": "medium",
    "title": "Search tree check",
    "prompt": "Search tree check\n\nWrite `searchTreeOk(level: (number | null)[]): boolean`.\n\nTopic: trees. Return whether the tree is a binary search tree with strict inequalities.\n\nExample\nsearchTreeOk([2, 1, 3]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "kth-tree-value",
    "difficulty": "medium",
    "title": "Kth tree value",
    "prompt": "Kth tree value\n\nWrite `kthTreeValue(level: (number | null)[], k: number): number`.\n\nTopic: trees. The tree is a binary search tree. Return the kth smallest value, counting from 1.\n\nExample\nkthTreeValue([3, 1, 4, null, 2], 1) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "right-edge",
    "difficulty": "medium",
    "title": "Right edge",
    "prompt": "Right edge\n\nWrite `rightEdge(level: (number | null)[]): number[]`.\n\nTopic: trees. Return the rightmost value of each level, top to bottom.\n\nExample\nrightEdge([1, 2, 3, null, 5, null, 4]) returns [1, 3, 4].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shared-ancestor",
    "difficulty": "medium",
    "title": "Shared ancestor",
    "prompt": "Shared ancestor\n\nWrite `sharedAncestor(level: (number | null)[], a: number, b: number): number`.\n\nTopic: trees. Values are unique. Return the lowest node that has both values in its subtree. A node counts as being in its own subtree.\n\nExample\nsharedAncestor([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "tree-loot",
    "difficulty": "medium",
    "title": "Tree loot",
    "prompt": "Tree loot\n\nWrite `treeLoot(level: (number | null)[]): number`.\n\nTopic: trees, dynamic programming. You cannot take a node and its child. Return the best sum.\n\nExample\ntreeLoot([3, 2, 3, null, 3, null, 1]) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "good-nodes",
    "difficulty": "medium",
    "title": "Good nodes",
    "prompt": "Good nodes\n\nWrite `goodNodes(level: (number | null)[]): number`.\n\nTopic: trees. A node is good when no value on the path from the root is strictly greater. Return how many good nodes there are.\n\nExample\ngoodNodes([3, 1, 4, 3, null, 1, 5]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "ship-capacity",
    "difficulty": "medium",
    "title": "Ship capacity",
    "prompt": "Ship capacity\n\nWrite `shipCapacity(weights: number[], days: number): number`.\n\nTopic: binary search. Packages ship in order. Each day takes a contiguous prefix that fits the capacity. Return the smallest capacity that finishes within days.\n\nExample\nshipCapacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5) returns 15.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "eating-speed",
    "difficulty": "medium",
    "title": "Eating speed",
    "prompt": "Eating speed\n\nWrite `eatingSpeed(piles: number[], hours: number): number`.\n\nTopic: binary search. Each hour you eat up to speed items from one pile. Return the smallest speed that finishes within hours.\n\nExample\neatingSpeed([3, 6, 7, 11], 8) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bloom-day",
    "difficulty": "medium",
    "title": "Bloom day",
    "prompt": "Bloom day\n\nWrite `bloomDay(bloom: number[], bouquets: number, adjacent: number): number`.\n\nTopic: binary search. bloom[i] is the day flower i opens. A bouquet needs that many adjacent open flowers. Return the earliest day you can make the bouquets, or -1.\n\nExample\nbloomDay([1, 10, 3, 10, 2], 3, 1) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "stall-gap",
    "difficulty": "medium",
    "title": "Stall gap",
    "prompt": "Stall gap\n\nWrite `stallGap(stalls: number[], cows: number): number`.\n\nTopic: binary search. Place that many cows on the stall positions and maximize the minimum distance. Return that distance.\n\nExample\nstallGap([1, 2, 4, 8, 9], 3) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "saw-height",
    "difficulty": "medium",
    "title": "Saw height",
    "prompt": "Saw height\n\nWrite `sawHeight(trees: number[], need: number): number`.\n\nTopic: binary search. A saw at height h collects max(0, tree-h) from each tree. Return the highest h that still collects at least need wood.\n\nExample\nsawHeight([20, 15, 10, 17], 7) returns 15.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "smallest-divisor",
    "difficulty": "medium",
    "title": "Smallest divisor",
    "prompt": "Smallest divisor\n\nWrite `smallestDivisor(values: number[], threshold: number): number`.\n\nTopic: binary search. Replace each value by its ceiling quotient with d. Return the smallest positive d whose quotients sum to at most threshold.\n\nExample\nsmallestDivisor([1, 2, 5, 9], 6) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rotated-minimum",
    "difficulty": "medium",
    "title": "Rotated minimum",
    "prompt": "Rotated minimum\n\nWrite `rotatedMinimum(values: number[]): number`.\n\nTopic: binary search. The unique values were sorted and then rotated. Return the minimum.\n\nExample\nrotatedMinimum([3, 4, 5, 1, 2]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "matrix-search",
    "difficulty": "medium",
    "title": "Matrix search",
    "prompt": "Matrix search\n\nWrite `matrixSearch(grid: number[][], target: number): boolean`.\n\nTopic: binary search. Each row is sorted, and each row starts after the previous row ends. Return whether target occurs.\n\nExample\nmatrixSearch([[1, 3, 5], [7, 9, 11]], 9) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pal-subseq-len",
    "difficulty": "medium",
    "title": "Palindromic subsequence length",
    "prompt": "Palindromic subsequence length\n\nWrite `palSubseqLength(text: string): number`.\n\nTopic: dynamic programming. Return the longest palindromic subsequence length.\n\nExample\npalSubseqLength('bbbab') returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pal-slice-count",
    "difficulty": "medium",
    "title": "Palindromic slice count",
    "prompt": "Palindromic slice count\n\nWrite `palSliceCount(text: string): number`.\n\nTopic: dynamic programming. Count palindromic substrings, including single letters.\n\nExample\npalSliceCount('aaa') returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "longest-pal-slice",
    "difficulty": "medium",
    "title": "Longest palindromic slice",
    "prompt": "Longest palindromic slice\n\nWrite `longestPalSlice(text: string): number`.\n\nTopic: strings. Return the length of the longest palindromic substring.\n\nExample\nlongestPalSlice('babad') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "equal-halves",
    "difficulty": "medium",
    "title": "Equal halves",
    "prompt": "Equal halves\n\nWrite `canSplitEven(values: number[]): boolean`.\n\nTopic: knapsack. Return whether the values split into two groups with equal sum.\n\nExample\ncanSplitEven([1, 5, 11, 5]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "sign-ways",
    "difficulty": "medium",
    "title": "Sign ways",
    "prompt": "Sign ways\n\nWrite `signWays(values: number[], target: number): number`.\n\nTopic: dynamic programming. Put + or - before each value. Count the ways to reach target.\n\nExample\nsignWays([1, 1, 1, 1, 1], 3) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "closest-stone-split",
    "difficulty": "medium",
    "title": "Closest stone split",
    "prompt": "Closest stone split\n\nWrite `closestStoneSplit(weights: number[]): number`.\n\nTopic: knapsack. Split the stones into two piles and return the smallest absolute difference of the sums.\n\nExample\nclosestStoneSplit([2, 7, 4, 1, 8, 1]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "combo-orders",
    "difficulty": "medium",
    "title": "Combination orders",
    "prompt": "Combination orders\n\nWrite `comboOrders(choices: number[], target: number): number`.\n\nTopic: dynamic programming. Distinct positive choices may be reused, and order matters. Count sequences that sum to target.\n\nExample\ncomboOrders([1, 2, 3], 4) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "combo-sets",
    "difficulty": "medium",
    "title": "Combination sets",
    "prompt": "Combination sets\n\nWrite `comboSets(choices: number[], target: number): number`.\n\nTopic: dynamic programming. Distinct positive choices may be reused, and order does not matter. Count combinations that sum to target.\n\nExample\ncomboSets([2, 3, 5], 8) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "paren-strings",
    "difficulty": "medium",
    "title": "Parenthesis strings",
    "prompt": "Parenthesis strings\n\nWrite `parenStringCount(pairs: number): number`.\n\nTopic: dynamic programming. Count valid strings that use exactly that many pairs of parentheses.\n\nExample\nparenStringCount(3) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "digit-letter-count",
    "difficulty": "medium",
    "title": "Digit letter count",
    "prompt": "Digit letter count\n\nWrite `digitLetterCount(digits: string): number`.\n\nTopic: backtracking. Digits 2 through 9 map to phone letters, with 7 and 9 having four. Count the strings those digits spell. Empty input spells nothing.\n\nExample\ndigitLetterCount('23') returns 9.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "nth-ugly",
    "difficulty": "medium",
    "title": "Nth ugly number",
    "prompt": "Nth ugly number\n\nWrite `nthUgly(n: number): number`.\n\nTopic: dynamic programming. Ugly numbers use only primes 2, 3, and 5, starting at 1. Return the nth.\n\nExample\nnthUgly(10) returns 12.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "primes-below",
    "difficulty": "medium",
    "title": "Primes below",
    "prompt": "Primes below\n\nWrite `primesBelow(n: number): number`.\n\nTopic: math. Return how many primes are strictly less than n.\n\nExample\nprimesBelow(10) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cable-cost",
    "difficulty": "medium",
    "title": "Cable cost",
    "prompt": "Cable cost\n\nWrite `cableCost(points: number, edges: [number, number, number][]): number`.\n\nTopic: minimum spanning tree. Undirected edges are [a, b, cost]. Connect points 0 through points-1 as cheaply as possible, or return -1.\n\nExample\ncableCost(4, [[0, 1, 1], [1, 2, 2], [0, 2, 4], [2, 3, 3]]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "reconnect-ops",
    "difficulty": "medium",
    "title": "Reconnect operations",
    "prompt": "Reconnect operations\n\nWrite `reconnectOps(n: number, edges: [number, number][]): number`.\n\nTopic: union-find. You may move an undirected edge. Return the fewest moves that connect nodes 0 through n-1, or -1.\n\nExample\nreconnectOps(4, [[0, 1], [0, 2], [1, 2]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "equation-check",
    "difficulty": "medium",
    "title": "Equation check",
    "prompt": "Equation check\n\nWrite `equationsHold(equations: string[]): boolean`.\n\nTopic: union-find. Each equation is a==b or a!=b. Return whether the list can be true together.\n\nExample\nequationsHold(['a==b', 'b!=c', 'c==a']) returns false.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "merge-accounts",
    "difficulty": "medium",
    "title": "Merge accounts",
    "prompt": "Merge accounts\n\nWrite `mergedAccountCount(accounts: string[][]): number`.\n\nTopic: union-find. A row is a name followed by emails. Shared email means one person. Return how many people there are.\n\nExample\nmergedAccountCount([['Alex','a@x','b@x'],['Alex','b@x','c@x'],['Bob','d@x']]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shortest-hop",
    "difficulty": "medium",
    "title": "Shortest hop",
    "prompt": "Shortest hop\n\nWrite `shortestHop(n: number, edges: [number, number, number][], source: number, target: number): number`.\n\nTopic: Dijkstra. Directed weights are non-negative. Return the cheapest source to target cost, or -1.\n\nExample\nshortestHop(4, [[0, 1, 1], [0, 2, 4], [1, 2, 1], [1, 3, 6], [2, 3, 1]], 0, 3) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "all-pairs-hop",
    "difficulty": "medium",
    "title": "One pair after all pairs",
    "prompt": "One pair after all pairs\n\nWrite `allPairsHop(n: number, edges: [number, number, number][], source: number, target: number): number`.\n\nTopic: Floyd-Warshall. No negative cycle. Return the cheapest source to target cost, or -1.\n\nExample\nallPairsHop(3, [[0, 1, 2], [1, 2, 3], [0, 2, 10]], 0, 2) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pair-chain",
    "difficulty": "medium",
    "title": "Pair chain",
    "prompt": "Pair chain\n\nWrite `pairChain(pairs: [number, number][]): number`.\n\nTopic: greedy. [c, d] may follow [a, b] only when b < c. Return the longest chain.\n\nExample\npairChain([[1, 2], [2, 3], [3, 4]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "largest-square",
    "difficulty": "medium",
    "title": "Largest square",
    "prompt": "Largest square\n\nWrite `largestSquare(grid: string[][]): number`.\n\nTopic: dynamic programming. Cells are '1' or '0'. Return the area of the largest square of ones.\n\nExample\nlargestSquare([['1','0','1','0','0'],['1','0','1','1','1'],['1','1','1','1','1'],['1','0','0','1','0']]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "count-squares",
    "difficulty": "medium",
    "title": "Count the squares",
    "prompt": "Count the squares\n\nWrite `countSquares(grid: number[][]): number`.\n\nTopic: dynamic programming. Count squares of ones, including 1 by 1 cells.\n\nExample\ncountSquares([[0,1,1,1],[1,1,1,1],[0,1,1,1]]) returns 15.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "knight-stay",
    "difficulty": "medium",
    "title": "Knight stays on the board",
    "prompt": "Knight stays on the board\n\nWrite `knightStay(n: number, moves: number, row: number, col: number): number`.\n\nTopic: dynamic programming. Return the probability, rounded to 5 decimals in the example, that a knight is still on the board.\n\nExample\nknightStay(3, 2, 0, 0) returns 0.0625.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "dice-target",
    "difficulty": "medium",
    "title": "Dice target",
    "prompt": "Dice target\n\nWrite `diceTarget(dice: number, faces: number, target: number): number`.\n\nTopic: dynamic programming. Faces are 1 through faces. Count ways to reach target, modulo 1000000007.\n\nExample\ndiceTarget(2, 6, 7) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "optimal-picks",
    "difficulty": "medium",
    "title": "Optimal picks",
    "prompt": "Optimal picks\n\nWrite `firstCanForce(piles: number[]): boolean`.\n\nTopic: games. Take from either end. Both play optimally. Return whether the starter can tie or win the sum.\n\nExample\nfirstCanForce([1, 5, 2]) returns false.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "stone-piles",
    "difficulty": "medium",
    "title": "Stone piles",
    "prompt": "Stone piles\n\nWrite `firstWinsPiles(piles: number[]): boolean`.\n\nTopic: games. Same end-taking game. Return whether the first player gets at least half the total when both play optimally.\n\nExample\nfirstWinsPiles([5, 3, 4, 5]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "paint-costs",
    "difficulty": "medium",
    "title": "Paint costs",
    "prompt": "Paint costs\n\nWrite `paintCosts(costs: number[][]): number`.\n\nTopic: dynamic programming. Each house has red, blue, and green costs. Neighbors differ. Return the cheapest plan.\n\nExample\npaintCosts([[17,2,17],[16,16,5],[14,3,19]]) returns 10.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "fence-colors",
    "difficulty": "medium",
    "title": "Fence colors",
    "prompt": "Fence colors\n\nWrite `fenceColors(posts: number, colors: number): number`.\n\nTopic: dynamic programming. At most two adjacent posts share a color. Count the paintings.\n\nExample\nfenceColors(3, 2) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "travel-passes",
    "difficulty": "medium",
    "title": "Travel passes",
    "prompt": "Travel passes\n\nWrite `travelPasses(days: number[], costs: [number, number, number]): number`.\n\nTopic: dynamic programming. Passes last 1, 7, or 30 days. Cover every travel day as cheaply as possible.\n\nExample\ntravelPasses([1,4,6,7,8,20], [2,7,15]) returns 11.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "arithmetic-slices",
    "difficulty": "medium",
    "title": "Arithmetic slices",
    "prompt": "Arithmetic slices\n\nWrite `arithmeticSlices(values: number[]): number`.\n\nTopic: dynamic programming. Count contiguous arithmetic runs of at least three values.\n\nExample\narithmeticSlices([1,2,3,4]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "longest-arithmetic",
    "difficulty": "medium",
    "title": "Longest arithmetic subsequence",
    "prompt": "Longest arithmetic subsequence\n\nWrite `longestArithmetic(values: number[]): number`.\n\nTopic: dynamic programming. Return the longest arithmetic subsequence length.\n\nExample\nlongestArithmetic([3,6,9,12]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "can-interleave",
    "difficulty": "medium",
    "title": "Can interleave",
    "prompt": "Can interleave\n\nWrite `canInterleave(a: string, b: string, woven: string): boolean`.\n\nTopic: dynamic programming. Return whether woven keeps the order of both strings.\n\nExample\ncanInterleave('aab', 'axy', 'aaxaby') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "one-edit-away",
    "difficulty": "medium",
    "title": "One edit away",
    "prompt": "One edit away\n\nWrite `oneEditAway(a: string, b: string): boolean`.\n\nTopic: strings. Return whether one insert, delete, or replace turns a into b.\n\nExample\noneEditAway('pale', 'ple') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "delete-distance",
    "difficulty": "medium",
    "title": "Delete distance",
    "prompt": "Delete distance\n\nWrite `deleteDistance(a: string, b: string): number`.\n\nTopic: dynamic programming. Return the fewest deletions that make the strings equal.\n\nExample\ndeleteDistance('sea', 'eat') returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "no-repeat-slice",
    "difficulty": "medium",
    "title": "Longest slice without a repeat",
    "prompt": "Longest slice without a repeat\n\nWrite `noRepeatSlice(text: string): number`.\n\nTopic: sliding window. Return the longest substring whose letters are all different.\n\nExample\nnoRepeatSlice('abbaec') returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "consecutive-run",
    "difficulty": "medium",
    "title": "Consecutive values",
    "prompt": "Consecutive values\n\nWrite `consecutiveRun(values: number[]): number`.\n\nTopic: hashing. Return the longest run of consecutive values, ignoring order and duplicates.\n\nExample\nconsecutiveRun([100, 4, 200, 1, 3, 2]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "repeat-cycle",
    "difficulty": "medium",
    "title": "Repeated cycle",
    "prompt": "Repeated cycle\n\nWrite `repeatCycle(ids: number[]): number`.\n\nTopic: cycles. ids holds n+1 integers drawn from 1 through n, so one value repeats. Return the repeated value. The cycle meets at that value.\n\nExample\nrepeatCycle([1, 3, 4, 2, 2]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "count-and-say",
    "difficulty": "medium",
    "title": "Count and say",
    "prompt": "Count and say\n\nWrite `countAndSay(n: number): string`.\n\nTopic: strings. Start from '1'. Each next term counts consecutive digits. Return term n, with n starting at 1.\n\nExample\ncountAndSay(4) returns \"1211\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "drop-k-digits",
    "difficulty": "medium",
    "title": "Drop K digits",
    "prompt": "Drop K digits\n\nWrite `dropDigits(number: string, k: number): string`.\n\nTopic: stack. number is a non-negative integer without leading zeros, unless it is zero. Delete k digits so the remaining number is as small as possible. Return it without leading zeros.\n\nExample\ndropDigits('1432219', 3) returns \"1219\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "largest-arrangement",
    "difficulty": "medium",
    "title": "Largest arrangement",
    "prompt": "Largest arrangement\n\nWrite `largestArrangement(values: number[]): string`.\n\nTopic: sorting. Arrange the values so their decimal concatenation is the largest possible. Return that numeral without a leading zero unless the value is zero.\n\nExample\nlargestArrangement([3, 30, 34, 5, 9]) returns \"9534330\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "price-span",
    "difficulty": "medium",
    "title": "Price span",
    "prompt": "Price span\n\nWrite `priceSpan(prices: number[]): number[]`.\n\nTopic: stack. For each day, return how many consecutive earlier days, including today, have a price less than or equal to today's.\n\nExample\npriceSpan([100, 80, 60, 70, 60, 75, 85]) returns [1, 1, 1, 2, 1, 4, 6].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "four-list-sums",
    "difficulty": "medium",
    "title": "Four list sums",
    "prompt": "Four list sums\n\nWrite `fourListSums(a: number[], b: number[], c: number[], d: number[]): number`.\n\nTopic: hashing. Count tuples that take one value from each list and add to 0.\n\nExample\nfourListSums([1, 2], [-2, -1], [-1, 2], [0, 2]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "next-generation",
    "difficulty": "medium",
    "title": "Next generation",
    "prompt": "Next generation\n\nWrite `nextGeneration(board: number[][]): number`.\n\nTopic: simulation. 1 is live. A live cell with two or three live neighbors stays live. A dead cell with three live neighbors becomes live. Return how many cells are live after one step.\n\nExample\nnextGeneration([[0,1,0],[0,0,1],[1,1,1],[0,0,0]]) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "sorted-grid-search",
    "difficulty": "medium",
    "title": "Search a sorted grid",
    "prompt": "Search a sorted grid\n\nWrite `sortedGridSearch(grid: number[][], target: number): boolean`.\n\nTopic: binary search. Each row and each column is sorted ascending. Return whether target occurs.\n\nExample\nsortedGridSearch([[1, 4, 7], [2, 5, 8], [3, 6, 9]], 5) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "open-lock",
    "difficulty": "medium",
    "title": "Open the lock",
    "prompt": "Open the lock\n\nWrite `openLock(deadEnds: string[], target: string): number`.\n\nTopic: BFS. A lock shows 4 digits. One move turns one digit by one, wrapping between 0 and 9. deadEnds jam the lock. Start at 0000. Return the fewest moves to target, or -1.\n\nExample\nopenLock(['0201', '0101', '0102', '1212', '2002'], '0202') returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shortest-bridge",
    "difficulty": "medium",
    "title": "Shortest bridge",
    "prompt": "Shortest bridge\n\nWrite `shortestBridge(grid: number[][]): number`.\n\nTopic: BFS. The grid has exactly two islands of 1s. Return the fewest 0s to flip to connect them.\n\nExample\nshortestBridge([[0,1],[1,0]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "two-oceans",
    "difficulty": "medium",
    "title": "Cells that reach both oceans",
    "prompt": "Cells that reach both oceans\n\nWrite `twoOceans(heights: number[][]): number`.\n\nTopic: graphs. The top and left edges drain to one ocean. The bottom and right drain to the other. Water flows to an equal or lower neighbor. Return how many cells can reach both oceans.\n\nExample\ntwoOceans([[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "land-enclaves",
    "difficulty": "medium",
    "title": "Land enclaves",
    "prompt": "Land enclaves\n\nWrite `landEnclaves(grid: number[][]): number`.\n\nTopic: graphs. 1 is land. Count land cells that cannot walk to the border by edge moves.\n\nExample\nlandEnclaves([[0,0,0,0],[1,0,1,0],[0,1,1,0],[0,0,0,0]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "eight-way-path",
    "difficulty": "medium",
    "title": "Eight-way clear path",
    "prompt": "Eight-way clear path\n\nWrite `eightWayPath(grid: number[][]): number`.\n\nTopic: BFS. 0 is open. You may step to any of the eight neighbors. Return the fewest steps from the top-left to the bottom-right, or -1. Count the starting cell as step 1.\n\nExample\neightWayPath([[0,1],[1,0]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "captured-region",
    "difficulty": "medium",
    "title": "Captured cells",
    "prompt": "Captured cells\n\nWrite `capturedCells(board: string[][]): number`.\n\nTopic: graphs. 'O' regions that do not touch the border are captured. Return how many O cells get captured.\n\nExample\ncapturedCells([['X','X','X','X'],['X','O','O','X'],['X','X','O','X'],['X','O','X','X']]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "inform-time",
    "difficulty": "medium",
    "title": "Time to inform",
    "prompt": "Time to inform\n\nWrite `informTime(managers: number[], head: number, minutes: number[]): number`.\n\nTopic: trees. managers[i] is the manager of employee i, or -1 for the head. minutes[i] is how long i takes to inform direct reports. Return the minutes until everyone knows, starting from head.\n\nExample\ninformTime([2, 2, -1, 2, 2], 2, [0, 0, 1, 0, 0]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "square-game",
    "difficulty": "medium",
    "title": "Square game",
    "prompt": "Square game\n\nWrite `squareGameWin(n: number): boolean`.\n\nTopic: games. A move subtracts a positive perfect square not larger than the current number. The player who faces 0 loses. Return whether the first player wins from n.\n\nExample\nsquareGameWin(1) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "choose-to-100",
    "difficulty": "medium",
    "title": "Choose without reaching",
    "prompt": "Choose without reaching\n\nWrite `firstCanReach(maxChoice: number, target: number): boolean`.\n\nTopic: games. Players alternately pick a fresh integer from 1 through maxChoice. The player who makes the running total reach or pass target wins. Return whether the first player wins. Integers cannot be reused.\n\nExample\nfirstCanReach(10, 11) returns false.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "division-queries",
    "difficulty": "medium",
    "title": "Division queries",
    "prompt": "Division queries\n\nWrite `divisionQueries(equations: [string, string][], values: number[], queries: [string, string][]): number[]`.\n\nTopic: graphs. Each equation a/b = values[i]. For each query, return a/b, or -1 if it cannot be determined.\n\nExample\ndivisionQueries([['a','b'],['b','c']], [2.0, 3.0], [['a','c'],['b','a'],['a','e']]) returns [6.0, 0.5, -1.0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "calendar-bookings",
    "difficulty": "medium",
    "title": "Calendar bookings",
    "prompt": "Calendar bookings\n\nWrite `calendarBookings(bookings: [number, number][]): boolean[]`.\n\nTopic: intervals. Each booking is half-open [start, end). Accept it only if it does not overlap an accepted booking. Return whether each booking, in order, was accepted.\n\nExample\ncalendarBookings([[10, 20], [15, 25], [20, 30]]) returns [true, false, true].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "flight-bookings",
    "difficulty": "medium",
    "title": "Flight bookings",
    "prompt": "Flight bookings\n\nWrite `flightBookings(bookings: [number, number, number][], flights: number): number[]`.\n\nTopic: difference array. A booking [first, last, seats] adds seats to flights first through last, numbered from 1. Return the seats on each flight.\n\nExample\nflightBookings([[1, 2, 10], [2, 3, 20], [2, 5, 25]], 5) returns [10, 55, 45, 25, 25].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "super-ugly",
    "difficulty": "medium",
    "title": "Nth super ugly",
    "prompt": "Nth super ugly\n\nWrite `nthSuperUgly(n: number, primes: number[]): number`.\n\nTopic: heaps. A super ugly number is 1 or a product of the given primes. Return the nth, counting from 1.\n\nExample\nnthSuperUgly(12, [2, 7, 13, 19]) returns 32.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "prime-count",
    "difficulty": "medium",
    "title": "Prime count",
    "prompt": "Prime count\n\nWrite `primeCount(limit: number): number`.\n\nTopic: math. Return how many primes are strictly less than limit.\n\nExample\nprimeCount(10) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "night-shift-loot",
    "difficulty": "medium",
    "title": "Night shift loot",
    "prompt": "Night shift loot\n\nWrite `nightShiftLoot(houses: number[]): number`.\n\nTopic: DP. You cannot take two adjacent houses. Return the greatest sum you can take.\n\nExample\nnightShiftLoot([2, 7, 9, 3, 1]) returns 12.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "gas-circuit",
    "difficulty": "medium",
    "title": "Gas circuit",
    "prompt": "Gas circuit\n\nWrite `gasCircuit(gas: number[], cost: number[]): number`.\n\nTopic: greedy. Stations sit on a circle. gas[i] is fuel gained and cost[i] is fuel to reach the next station. Return the starting index that completes the circuit, or -1. If one start works, it is unique.\n\nExample\ngasCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "dictionary-break",
    "difficulty": "medium",
    "title": "Dictionary break",
    "prompt": "Dictionary break\n\nWrite `canBreak(text: string, words: string[]): boolean`.\n\nTopic: DP. Return whether text can be segmented into a sequence of dictionary words. Words may repeat.\n\nExample\ncanBreak('recruiting', ['re', 'cruit', 'ing', 'recruit']) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "coin-orderings",
    "difficulty": "medium",
    "title": "Coin orderings",
    "prompt": "Coin orderings\n\nWrite `coinOrderings(coins: number[], amount: number): number`.\n\nTopic: DP. Count the ways to make amount using unlimited coins. Order does not matter.\n\nExample\ncoinOrderings([1, 2, 5], 5) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "fewest-coins-amount",
    "difficulty": "medium",
    "title": "Fewest coins for an amount",
    "prompt": "Fewest coins for an amount\n\nWrite `fewestForAmount(coins: number[], amount: number): number`.\n\nTopic: DP. Coins may be reused. Return the fewest coins that sum to amount, or -1.\n\nExample\nfewestForAmount([1, 2, 5], 11) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rising-run",
    "difficulty": "medium",
    "title": "Longest rising run",
    "prompt": "Longest rising run\n\nWrite `longestRising(values: number[]): number`.\n\nTopic: DP. Return the length of the longest strictly increasing subsequence. It need not be contiguous.\n\nExample\nlongestRising([10, 9, 2, 5, 3, 7, 101, 18]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "triangle-cost",
    "difficulty": "medium",
    "title": "Triangle path cost",
    "prompt": "Triangle path cost\n\nWrite `triangleCost(rows: number[][]): number`.\n\nTopic: DP. From a cell you may step to either adjacent cell in the next row. Return the cheapest path from the top to the bottom.\n\nExample\ntriangleCost([[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]]) returns 11.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "palindrome-slices",
    "difficulty": "medium",
    "title": "Palindrome slices",
    "prompt": "Palindrome slices\n\nWrite `palindromeSlices(text: string): number`.\n\nTopic: DP. Count contiguous slices that read the same forward and backward. Single letters count.\n\nExample\npalindromeSlices('aaa') returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "longest-mirror-slice",
    "difficulty": "medium",
    "title": "Longest mirror slice",
    "prompt": "Longest mirror slice\n\nWrite `longestMirrorSlice(text: string): number`.\n\nTopic: strings. Return the length of the longest contiguous slice that reads the same forward and backward.\n\nExample\nlongestMirrorSlice('babad') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "quarter-turn",
    "difficulty": "medium",
    "title": "Quarter turn",
    "prompt": "Quarter turn\n\nWrite `quarterTurn(matrix: number[][]): number[][]`.\n\nTopic: arrays. Return the matrix rotated 90 degrees clockwise. Do not change the input.\n\nExample\nquarterTurn([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) returns [[7, 4, 1], [8, 5, 2], [9, 6, 3]].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "clear-lines",
    "difficulty": "medium",
    "title": "Clear lines",
    "prompt": "Clear lines\n\nWrite `clearLines(matrix: number[][]): number[][]`.\n\nTopic: arrays. If a cell is 0, set its whole row and column to 0. Apply that from the original zeros only. Return the new matrix.\n\nExample\nclearLines([[1, 1, 1], [1, 0, 1], [1, 1, 1]]) returns [[1, 0, 1], [0, 0, 0], [1, 0, 1]].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "course-order-possible",
    "difficulty": "medium",
    "title": "Course order possible",
    "prompt": "Course order possible\n\nWrite `canFinishCourses(count: number, prerequisites: [number, number][]): boolean`.\n\nTopic: graphs. There are count courses numbered from 0. A pair [course, required] means required must come first. Return whether a full order exists.\n\nExample\ncanFinishCourses(2, [[1, 0]]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "short-path",
    "difficulty": "medium",
    "title": "Short path",
    "prompt": "Short path\n\nWrite `shortPath(path: string): string`.\n\nTopic: stack. path is a Unix path. '.' stays, '..' goes up, and repeated slashes collapse. Return the canonical path.\n\nExample\nshortPath('/home//desk/../docs/') returns \"/home/docs\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "repeat-marker",
    "difficulty": "medium",
    "title": "Repeat marker",
    "prompt": "Repeat marker\n\nWrite `expandMarkers(text: string): string`.\n\nTopic: stack. k[text] means text repeated k times. Markers nest. Digits form the repeat count. Return the expanded string.\n\nExample\nexpandMarkers('3[a2[c]]') returns \"accaccacc\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pair-count",
    "difficulty": "medium",
    "title": "Balanced pair count",
    "prompt": "Balanced pair count\n\nWrite `balancedPairCount(pairs: number): number`.\n\nTopic: DP. Return how many strings of pairs pairs of parentheses are correctly balanced.\n\nExample\nbalancedPairCount(3) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "unbounded-pick-count",
    "difficulty": "medium",
    "title": "Unbounded pick count",
    "prompt": "Unbounded pick count\n\nWrite `unboundedPickCount(options: number[], target: number): number`.\n\nTopic: DP. You may reuse options. Count combinations that add to target. Order does not matter.\n\nExample\nunboundedPickCount([2, 3, 6, 7], 7) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "signed-target",
    "difficulty": "medium",
    "title": "Signed target",
    "prompt": "Signed target\n\nWrite `signedTarget(values: number[], target: number): number`.\n\nTopic: DP. Put + or - before each value. Count the assignments whose total equals target.\n\nExample\nsignedTarget([1, 1, 1, 1, 1], 3) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pack-value",
    "difficulty": "medium",
    "title": "Pack value",
    "prompt": "Pack value\n\nWrite `packValue(weights: number[], values: number[], capacity: number): number`.\n\nTopic: DP. Each item may be taken at most once. Return the greatest value that fits in capacity.\n\nExample\npackValue([1, 3, 4], [15, 20, 30], 4) returns 35.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shared-sequence",
    "difficulty": "medium",
    "title": "Shared sequence",
    "prompt": "Shared sequence\n\nWrite `sharedSequence(left: string, right: string): number`.\n\nTopic: DP. Return the length of the longest subsequence shared by both strings. It need not be contiguous.\n\nExample\nsharedSequence('abcde', 'ace') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "widest-container",
    "difficulty": "medium",
    "title": "Widest water container",
    "prompt": "Widest water container\n\nWrite `widestContainer(heights: number[]): number`.\n\nTopic: two pointers. heights[i] is a vertical line at x = i. Pick two lines. Return the greatest area of water they hold.\n\nExample\nwidestContainer([1, 8, 6, 2, 5, 4, 8, 3, 7]) returns 49.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "asteroid-clash",
    "difficulty": "medium",
    "title": "Asteroid clash",
    "prompt": "Asteroid clash\n\nWrite `asteroidClash(asteroids: number[]): number[]`.\n\nTopic: stack. A positive value moves right and a negative value moves left, all at the same speed. On a collision the smaller absolute value explodes. Equal magnitudes both explode. Return the survivors in order.\n\nExample\nasteroidClash([5, 10, -5]) returns [5, 10].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "smallest-unique-order",
    "difficulty": "medium",
    "title": "Smallest unique order",
    "prompt": "Smallest unique order\n\nWrite `smallestUniqueOrder(text: string): string`.\n\nTopic: stack. Return the smallest lexicographical string that contains each distinct character of text exactly once, and could be a subsequence of text.\n\nExample\nsmallestUniqueOrder('bcabc') returns \"abc\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "pattern-starts",
    "difficulty": "medium",
    "title": "Pattern starts",
    "prompt": "Pattern starts\n\nWrite `patternStarts(text: string, pattern: string): number[]`.\n\nTopic: sliding window. Return every index where a permutation of pattern begins in text.\n\nExample\npatternStarts('cbaebabacd', 'abc') returns [0, 6].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "repeat-budget",
    "difficulty": "medium",
    "title": "Longest run with a budget",
    "prompt": "Longest run with a budget\n\nWrite `longestWithBudget(text: string, budget: number): number`.\n\nTopic: sliding window. You may replace at most budget characters. Return the longest slice you can make into one repeated character.\n\nExample\nlongestWithBudget('AABABBA', 1) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "sum-k-count",
    "difficulty": "medium",
    "title": "Slices summing to K",
    "prompt": "Slices summing to K\n\nWrite `slicesSummingTo(values: number[], target: number): number`.\n\nTopic: prefix sums. Count contiguous slices whose sum equals target. Values may be negative.\n\nExample\nslicesSummingTo([1, 1, 1], 2) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bounded-slices",
    "difficulty": "medium",
    "title": "Bounded slices",
    "prompt": "Bounded slices\n\nWrite `boundedSlices(values: number[], low: number, high: number): number`.\n\nTopic: sliding window. values are non-negative. Count contiguous slices whose sum is between low and high inclusive.\n\nExample\nboundedSlices([2, 1, 4, 3], 2, 3) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "network-parts",
    "difficulty": "medium",
    "title": "Network parts",
    "prompt": "Network parts\n\nWrite `networkParts(nodes: number, links: [number, number][]): number`.\n\nTopic: union-find. Nodes are 0 through nodes-1. An undirected link joins two nodes. Return how many connected parts there are.\n\nExample\nnetworkParts(5, [[0, 1], [1, 2], [3, 4]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "travel-minutes",
    "difficulty": "medium",
    "title": "Travel minutes",
    "prompt": "Travel minutes\n\nWrite `travelMinutes(nodes: number, roads: [number, number, number][], start: number): number[]`.\n\nTopic: graphs. A road is [from, to, minutes] and is directed. Return the minutes from start to every node 0 through nodes-1. Use -1 if a node is unreachable.\n\nExample\ntravelMinutes(4, [[0, 1, 2], [0, 2, 5], [1, 2, 1], [1, 3, 4]], 0) returns [0, 2, 3, 6].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "task-order",
    "difficulty": "medium",
    "title": "Task order",
    "prompt": "Task order\n\nWrite `taskOrder(count: number, rules: [number, number][]): number[]`.\n\nTopic: graphs. Tasks are 0 through count-1. A rule [before, after] means before must finish first. Return one valid order, preferring smaller numbers when several are ready. Return an empty list if a cycle exists.\n\nExample\ntaskOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]]) returns [3, 1, 2, 0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "site-span",
    "difficulty": "medium",
    "title": "Longest site span",
    "prompt": "Longest site span\n\nWrite `longestSiteSpan(sites: number, roads: [number, number][]): number`.\n\nTopic: trees. roads form a tree on sites 0 through sites-1. Return the number of roads on the longest path.\n\nExample\nlongestSiteSpan(4, [[0, 1], [1, 2], [1, 3]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "zero-triplets",
    "difficulty": "medium",
    "title": "Zero triplets",
    "prompt": "Zero triplets\n\nWrite `zeroTriplets(values: number[]): number`.\n\nTopic: two pointers. Count unordered triplets of different indexes that add to 0. Identical multisets count once.\n\nExample\nzeroTriplets([-1, 0, 1, 2, -1, -4]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "best-product-slice",
    "difficulty": "medium",
    "title": "Best product slice",
    "prompt": "Best product slice\n\nWrite `bestProductSlice(values: number[]): number`.\n\nTopic: DP. Return the greatest product of a non-empty contiguous slice.\n\nExample\nbestProductSlice([2, 3, -2, 4]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "spiral-read",
    "difficulty": "medium",
    "title": "Spiral read",
    "prompt": "Spiral read\n\nWrite `spiralRead(matrix: number[][]): number[]`.\n\nTopic: arrays. Read the matrix in clockwise spiral order.\n\nExample\nspiralRead([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) returns [1, 2, 3, 6, 9, 8, 7, 4, 5].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "citation-index",
    "difficulty": "medium",
    "title": "Citation index",
    "prompt": "Citation index\n\nWrite `citationIndex(citations: number[]): number`.\n\nTopic: sorting. A researcher has index h if h papers have at least h citations each. Return the greatest such h.\n\nExample\ncitationIndex([3, 0, 6, 1, 5]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cooldown-span",
    "difficulty": "medium",
    "title": "Cooldown span",
    "prompt": "Cooldown span\n\nWrite `cooldownSpan(tasks: string[], cooldown: number): number`.\n\nTopic: greedy. Identical tasks need at least cooldown other slots between them. Idle slots count. Return the shortest schedule length.\n\nExample\ncooldownSpan(['A', 'A', 'A', 'B', 'B', 'B'], 2) returns 8.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "inbox-groups",
    "difficulty": "medium",
    "title": "Inbox groups",
    "prompt": "Inbox groups\n\nWrite `inboxGroups(accounts: string[][]): number`.\n\nTopic: union-find. Each account starts with a name and then email addresses. Emails that appear together belong to one person even if the names differ. Return how many distinct people there are.\n\nExample\ninboxGroups([['Gabe', 'a@x', 'b@x'], ['Gabe', 'c@x'], ['Gabe', 'b@x', 'd@x']]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "island-count",
    "difficulty": "medium",
    "title": "Island count",
    "prompt": "Island count\n\nWrite `islandCount(grid: string[][]): number`.\n\nTopic: graphs. '1' is land and '0' is water. Land connects on edges, not corners. Return how many islands there are.\n\nExample\nislandCount([['1','1','0'],['0','1','0'],['1','0','1']]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "largest-island-area",
    "difficulty": "medium",
    "title": "Largest island area",
    "prompt": "Largest island area\n\nWrite `largestIslandArea(grid: number[][]): number`.\n\nTopic: graphs. 1 is land. Return the area of the largest island, or 0 if there is no land.\n\nExample\nlargestIslandArea([[0, 1, 1], [0, 1, 0], [1, 0, 0]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rotten-crates",
    "difficulty": "medium",
    "title": "Minutes until crates spoil",
    "prompt": "Minutes until crates spoil\n\nWrite `minutesUntilSpoiled(grid: number[][]): number`.\n\nTopic: BFS. 0 is empty, 1 is fresh, and 2 is spoiled. Each minute, spoiled crates spoil their edge neighbors. Return the minutes until every fresh crate spoils, or -1.\n\nExample\nminutesUntilSpoiled([[2, 1, 1], [1, 1, 0], [0, 1, 1]]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "aisle-steps",
    "difficulty": "medium",
    "title": "Aisle steps",
    "prompt": "Aisle steps\n\nWrite `aisleSteps(grid: number[][]): number`.\n\nTopic: BFS. 0 is open and 1 is blocked. Move up, down, left, or right. Return the fewest steps from the top-left to the bottom-right, counting the start as 1, or -1.\n\nExample\naisleSteps([[0, 0, 0], [1, 1, 0], [1, 1, 0]]) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-circle-loot",
    "difficulty": "medium",
    "title": "Circular night route",
    "prompt": "Circular night route\n\nWrite `circularNightRoute(houses: number[]): number`.\n\nTopic: DP. Houses stand in a circle, so the first and last are adjacent. You cannot take adjacent houses. Return the greatest sum.\n\nExample\ncircularNightRoute([2, 3, 2]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-delete-earn",
    "difficulty": "medium",
    "title": "Delete and earn",
    "prompt": "Delete and earn\n\nWrite `deleteAndEarn(values: number[]): number`.\n\nTopic: DP. Taking a value earns every copy of it and deletes every copy of the neighbors value-1 and value+1. Return the greatest total.\n\nExample\ndeleteAndEarn([3, 4, 2]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-integer-break",
    "difficulty": "medium",
    "title": "Integer break product",
    "prompt": "Integer break product\n\nWrite `integerBreakProduct(n: number): number`.\n\nTopic: DP. Split n into at least two positive integers. Return the greatest product.\n\nExample\nintegerBreakProduct(10) returns 36.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-square-sum",
    "difficulty": "medium",
    "title": "Fewest squares",
    "prompt": "Fewest squares\n\nWrite `fewestSquares(n: number): number`.\n\nTopic: DP. Return the fewest perfect squares that add to n.\n\nExample\nfewestSquares(12) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-pair-chain",
    "difficulty": "medium",
    "title": "Chained pairs",
    "prompt": "Chained pairs\n\nWrite `chainedPairs(pairs: [number, number][]): number`.\n\nTopic: greedy. Pair (a, b) may follow a pair that ends strictly before a. Return the longest chain.\n\nExample\nchainedPairs([[1, 2], [2, 3], [3, 4]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-clip-stitch",
    "difficulty": "medium",
    "title": "Video clip cover",
    "prompt": "Video clip cover\n\nWrite `videoClipCover(clips: [number, number][], time: number): number`.\n\nTopic: greedy. Cover time 0 through time with the fewest clips. Return that count, or -1.\n\nExample\nvideoClipCover([[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], 10) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-jump-zero",
    "difficulty": "medium",
    "title": "Reach a zero cell",
    "prompt": "Reach a zero cell\n\nWrite `reachZeroCell(values: number[], start: number): boolean`.\n\nTopic: graphs. From i you jump exactly values[i] left or right inside the array. Return whether a 0 is reachable.\n\nExample\nreachZeroCell([4, 2, 3, 0, 3, 1, 2], 5) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-ship-capacity",
    "difficulty": "medium",
    "title": "Least ship capacity",
    "prompt": "Least ship capacity\n\nWrite `leastShipCapacity(weights: number[], days: number): number`.\n\nTopic: binary search. Packages ship in order. One sailing per day. Return the least capacity that finishes in days.\n\nExample\nleastShipCapacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5) returns 15.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-eating-speed",
    "difficulty": "medium",
    "title": "Crate eating speed",
    "prompt": "Crate eating speed\n\nWrite `crateEatingSpeed(piles: number[], hours: number): number`.\n\nTopic: binary search. Each hour you finish k crates from one pile, or the rest of that pile. Return the smallest k that finishes within hours.\n\nExample\ncrateEatingSpeed([3, 6, 7, 11], 8) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-peak-index",
    "difficulty": "medium",
    "title": "A peak index",
    "prompt": "A peak index\n\nWrite `aPeakIndex(values: number[]): number`.\n\nTopic: binary search. The sequence rises and then falls, or is strictly monotone. Return an index greater than its existing neighbors.\n\nExample\naPeakIndex([1, 2, 3, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-flat-search",
    "difficulty": "medium",
    "title": "Flattened grid search",
    "prompt": "Flattened grid search\n\nWrite `flattenedGridSearch(grid: number[][], target: number): boolean`.\n\nTopic: binary search. Rows are sorted and each row starts above the previous row's end. Return whether target occurs.\n\nExample\nflattenedGridSearch([[1, 3, 5], [7, 9, 11]], 9) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-next-order",
    "difficulty": "medium",
    "title": "Next permutation",
    "prompt": "Next permutation\n\nWrite `nextPermutation(values: number[]): number[]`.\n\nTopic: arrays. Return the next permutation in lexicographical order, or the first if this is the last.\n\nExample\nnextPermutation([1, 2, 3]) returns [1, 3, 2].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-blocked-routes",
    "difficulty": "medium",
    "title": "Routes around blocks",
    "prompt": "Routes around blocks\n\nWrite `routesAroundBlocks(grid: number[][]): number`.\n\nTopic: DP. 1 is blocked. Move only right or down from the top-left. Return how many ways reach the bottom-right.\n\nExample\nroutesAroundBlocks([[0, 0, 0], [0, 1, 0], [0, 0, 0]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-falling-path",
    "difficulty": "medium",
    "title": "Cheapest falling path",
    "prompt": "Cheapest falling path\n\nWrite `cheapestFallingPath(grid: number[][]): number`.\n\nTopic: DP. Step straight down or diagonally down. Return the cheapest top-to-bottom path.\n\nExample\ncheapestFallingPath([[2, 1, 3], [6, 5, 4], [7, 8, 9]]) returns 13.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-knight-dials",
    "difficulty": "medium",
    "title": "Phone knight hops",
    "prompt": "Phone knight hops\n\nWrite `phoneKnightHops(hops: number): number`.\n\nTopic: DP. A knight starts on any digit and makes hops-1 jumps on a phone pad. Return how many sequences of that length exist, modulo 1000000007.\n\nExample\nphoneKnightHops(1) returns 10.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-dice-target",
    "difficulty": "medium",
    "title": "Dice sum ways",
    "prompt": "Dice sum ways\n\nWrite `diceSumWays(diceCount: number, faces: number, target: number): number`.\n\nTopic: DP. Faces are 1 through faces. Return ways to sum to target, modulo 1000000007.\n\nExample\ndiceSumWays(2, 6, 7) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-interleave",
    "difficulty": "medium",
    "title": "Order-preserving mix",
    "prompt": "Order-preserving mix\n\nWrite `orderPreservingMix(left: string, right: string, goal: string): boolean`.\n\nTopic: DP. Return whether goal mixes left and right while keeping each string's order.\n\nExample\norderPreservingMix('aab', 'axy', 'aaxaby') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-address-count",
    "difficulty": "medium",
    "title": "Dotted address count",
    "prompt": "Dotted address count\n\nWrite `dottedAddressCount(digits: string): number`.\n\nTopic: backtracking. Count splits into four parts, each an integer 0 through 255 with no leading zero.\n\nExample\ndottedAddressCount('25525511135') returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-paren-values",
    "difficulty": "medium",
    "title": "Parenthesized results",
    "prompt": "Parenthesized results\n\nWrite `parenthesizedResults(expression: string): number`.\n\nTopic: divide and conquer. Count distinct values from fully parenthesizing an expression of digits and + - *.\n\nExample\nparenthesizedResults('2*3-4*5') returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-desk-calc",
    "difficulty": "medium",
    "title": "Inline calculator",
    "prompt": "Inline calculator\n\nWrite `inlineCalculator(expression: string): number`.\n\nTopic: stack. + and - are weaker than * and /. Division truncates toward zero. Return the value.\n\nExample\ninlineCalculator('3+2*2') returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-version-order",
    "difficulty": "medium",
    "title": "Compare versions",
    "prompt": "Compare versions\n\nWrite `compareVersions(left: string, right: string): number`.\n\nTopic: strings. Return -1, 0, or 1 comparing dot-separated versions. Missing parts are 0.\n\nExample\ncompareVersions('1.01', '1.001') returns 0.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-zigzag",
    "difficulty": "medium",
    "title": "Zigzag rows",
    "prompt": "Zigzag rows\n\nWrite `zigzagRows(text: string, rows: number): string`.\n\nTopic: strings. Write down the rows in a zigzag, then read across.\n\nExample\nzigzagRows('PAYPALISHIRING', 3) returns \"PAHNAPLSIIGYIR\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-provinces",
    "difficulty": "medium",
    "title": "City provinces",
    "prompt": "City provinces\n\nWrite `cityProvinces(links: number[][]): number`.\n\nTopic: graphs. links[i][j] is 1 when cities are connected. Return the province count.\n\nExample\ncityProvinces([[1,1,0],[1,1,0],[0,0,1]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-closed-islands",
    "difficulty": "medium",
    "title": "Interior islands",
    "prompt": "Interior islands\n\nWrite `interiorIslands(grid: number[][]): number`.\n\nTopic: graphs. 0 is land and 1 is water. Count land islands that do not touch the border.\n\nExample\ninteriorIslands([[1,1,1,1],[1,0,0,1],[1,1,0,1],[1,1,1,1]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-reorder-roads",
    "difficulty": "medium",
    "title": "Roads toward zero",
    "prompt": "Roads toward zero\n\nWrite `roadsTowardZero(cities: number, roads: [number, number][]): number`.\n\nTopic: graphs. Reverse the fewest directed tree edges so every city can reach 0.\n\nExample\nroadsTowardZero(6, [[0,1],[1,3],[2,3],[4,0],[4,5]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-extra-wires",
    "difficulty": "medium",
    "title": "Wires to reconnect",
    "prompt": "Wires to reconnect\n\nWrite `wiresToReconnect(nodes: number, wires: [number, number][]): number`.\n\nTopic: union-find. Move existing wires to connect every node, or return -1.\n\nExample\nwiresToReconnect(4, [[0,1],[0,2],[1,2]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-path-effort",
    "difficulty": "medium",
    "title": "Least height effort",
    "prompt": "Least height effort\n\nWrite `leastHeightEffort(heights: number[][]): number`.\n\nTopic: graphs. Effort is the largest absolute step on the path. Return the least effort to the opposite corner.\n\nExample\nleastHeightEffort([[1,2,2],[3,8,2],[5,3,5]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-predict-score",
    "difficulty": "medium",
    "title": "Ends of the row",
    "prompt": "Ends of the row\n\nWrite `endsOfTheRow(values: number[]): boolean`.\n\nTopic: games. Players take either end. Return whether the first player can force a strictly higher total.\n\nExample\nendsOfTheRow([1,5,2]) returns false.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-travel-passes",
    "difficulty": "medium",
    "title": "Pass prices",
    "prompt": "Pass prices\n\nWrite `passPrices(days: number[], costs: [number, number, number]): number`.\n\nTopic: DP. costs are 1-day, 7-day, and 30-day passes. Cover every listed day as cheaply as possible.\n\nExample\npassPrices([1,4,6,7,8,20], [2,7,15]) returns 11.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-valid-square",
    "difficulty": "medium",
    "title": "Square corners",
    "prompt": "Square corners\n\nWrite `areSquareCorners(points: [number, number][]): boolean`.\n\nTopic: geometry. Return whether four points are corners of a positive-area square.\n\nExample\nareSquareCorners([[0,0],[1,1],[1,0],[0,1]]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-rect-area",
    "difficulty": "medium",
    "title": "Covered rectangle area",
    "prompt": "Covered rectangle area\n\nWrite `coveredRectangleArea(first: [number, number, number, number], second: [number, number, number, number]): number`.\n\nTopic: geometry. Each box is bottom-left then top-right. Return the covered area.\n\nExample\ncoveredRectangleArea([-3,0,3,4], [0,-1,9,2]) returns 45.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-monotone-digits",
    "difficulty": "medium",
    "title": "Nondecreasing digits",
    "prompt": "Nondecreasing digits\n\nWrite `largestNondecreasing(value: number): number`.\n\nTopic: greedy. Return the largest integer at most value whose digits never decrease.\n\nExample\nlargestNondecreasing(332) returns 299.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-broken-calc",
    "difficulty": "medium",
    "title": "Broken display",
    "prompt": "Broken display\n\nWrite `brokenDisplay(start: number, target: number): number`.\n\nTopic: greedy. Double or subtract 1. Return the fewest operations from start to target.\n\nExample\nbrokenDisplay(2, 3) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-two-keys",
    "difficulty": "medium",
    "title": "Copy and paste count",
    "prompt": "Copy and paste count\n\nWrite `copyAndPasteCount(n: number): number`.\n\nTopic: DP. Start with one character. Copy All then Paste. Return the fewest operations that yield n characters.\n\nExample\ncopyAndPasteCount(3) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-circular-slice",
    "difficulty": "medium",
    "title": "Circular slice sum",
    "prompt": "Circular slice sum\n\nWrite `circularSliceSum(values: number[]): number`.\n\nTopic: DP. A non-empty slice may wrap once. Return the greatest sum. Do not wrap the entire array as if it were two copies.\n\nExample\ncircularSliceSum([5,-3,5]) returns 10.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-wiggle",
    "difficulty": "medium",
    "title": "Alternating length",
    "prompt": "Alternating length\n\nWrite `alternatingLength(values: number[]): number`.\n\nTopic: greedy. Return the longest subsequence that strictly rises and falls in turn.\n\nExample\nalternatingLength([1, 7, 4, 9, 2, 5]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-triplet",
    "difficulty": "medium",
    "title": "Three rising indexes",
    "prompt": "Three rising indexes\n\nWrite `hasThreeRising(values: number[]): boolean`.\n\nTopic: greedy. Return whether three increasing indexes hold strictly increasing values.\n\nExample\nhasThreeRising([1, 2, 3, 4, 5]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-mountain",
    "difficulty": "medium",
    "title": "Peak mountain length",
    "prompt": "Peak mountain length\n\nWrite `peakMountainLength(values: number[]): number`.\n\nTopic: arrays. A mountain rises strictly then falls strictly and has length at least 3. Return the longest, or 0.\n\nExample\npeakMountainLength([2, 1, 4, 7, 3, 2, 5]) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-ones",
    "difficulty": "medium",
    "title": "Longest ones after flips",
    "prompt": "Longest ones after flips\n\nWrite `longestOnesAfterFlips(values: number[], budget: number): number`.\n\nTopic: sliding window. Flip at most budget zeros. Return the longest run of ones.\n\nExample\nlongestOnesAfterFlips([1,1,1,0,0,0,1,1,1,1,0], 2) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-divisible",
    "difficulty": "medium",
    "title": "Slices divisible by K",
    "prompt": "Slices divisible by K\n\nWrite `slicesDivisibleBy(values: number[], k: number): number`.\n\nTopic: prefix sums. Count slices whose sum is divisible by k.\n\nExample\nslicesDivisibleBy([4, 5, 0, -2, -3, 1], 5) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-multiple",
    "difficulty": "medium",
    "title": "Long multiple slice",
    "prompt": "Long multiple slice\n\nWrite `hasLongMultipleSlice(values: number[], k: number): boolean`.\n\nTopic: prefix sums. Return whether some slice of length at least 2 has a sum divisible by k.\n\nExample\nhasLongMultipleSlice([23, 2, 4, 6, 7], 6) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-reorg",
    "difficulty": "medium",
    "title": "No adjacent repeat",
    "prompt": "No adjacent repeat\n\nWrite `noAdjacentRepeat(text: string): string`.\n\nTopic: heaps. Rearrange so equal letters are not adjacent. Return any answer, or empty if impossible.\n\nExample\nnoAdjacentRepeat('aab') returns \"aba\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-custom",
    "difficulty": "medium",
    "title": "Order from a key",
    "prompt": "Order from a key\n\nWrite `orderFromKey(order: string, text: string): string`.\n\nTopic: sorting. Letters in order come first in that order. Other letters stay stable after them.\n\nExample\norderFromKey('cba', 'abcd') returns \"cbad\".\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-mail",
    "difficulty": "medium",
    "title": "Distinct normalized mail",
    "prompt": "Distinct normalized mail\n\nWrite `distinctNormalizedMail(addresses: string[]): number`.\n\nTopic: strings. Ignore dots and a plus suffix in the local part. Return how many addresses remain.\n\nExample\ndistinctNormalizedMail(['a.b+c@x.com', 'ab@x.com']) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-revint",
    "difficulty": "medium",
    "title": "Reverse digits with a cap",
    "prompt": "Reverse digits with a cap\n\nWrite `reverseDigitsCapped(value: number): number`.\n\nTopic: math. Reverse digits and keep the sign. Return 0 when the result leaves the 32-bit signed range.\n\nExample\nreverseDigitsCapped(123) returns 321.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-atoi",
    "difficulty": "medium",
    "title": "Read a clamped integer",
    "prompt": "Read a clamped integer\n\nWrite `readClampedInteger(text: string): number`.\n\nTopic: strings. Skip spaces, read a sign and digits, and clamp to 32-bit signed range.\n\nExample\nreadClampedInteger('   -42') returns -42.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "first-open-slot",
    "difficulty": "hard",
    "title": "First open slot",
    "prompt": "First open slot\n\nWrite `firstOpenSlot(ids: number[]): number`.\n\nTopic: arrays. Values may be negative or larger than the length. Return the smallest missing positive integer.\n\nExample\nfirstOpenSlot([3, 4, -1, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "segment-count",
    "difficulty": "hard",
    "title": "Segment count",
    "prompt": "Segment count\n\nWrite `segmentCount(text: string, words: string[]): number`.\n\nTopic: dynamic programming. Count ordered splits of text into dictionary words. Different cut positions are different ways.\n\nExample\nsegmentCount('catsanddog', ['cat', 'cats', 'and', 'sand', 'dog']) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "at-most-k-trades",
    "difficulty": "hard",
    "title": "At most K trades",
    "prompt": "At most K trades\n\nWrite `atMostKTrades(k: number, prices: number[]): number`.\n\nTopic: dynamic programming. Complete at most k buy-then-sell trades. Return the best profit.\n\nExample\natMostKTrades(2, [3, 2, 6, 5, 0, 3]) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "longest-valid-brackets",
    "difficulty": "hard",
    "title": "Longest valid brackets",
    "prompt": "Longest valid brackets\n\nWrite `longestValidBrackets(text: string): number`.\n\nTopic: stack. Return the length of the longest valid parenthesis substring.\n\nExample\nlongestValidBrackets(')()())') returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "candy-line",
    "difficulty": "hard",
    "title": "Candy line",
    "prompt": "Candy line\n\nWrite `candyLine(ratings: number[]): number`.\n\nTopic: greedy. Each child gets at least one candy, and a higher rating than a neighbor gets more than that neighbor. Return the minimum total.\n\nExample\ncandyLine([1, 0, 2]) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "best-tree-path",
    "difficulty": "hard",
    "title": "Best tree path",
    "prompt": "Best tree path\n\nWrite `bestTreePath(level: (number | null)[]): number`.\n\nTopic: trees, dynamic programming. A path follows parent links and may start and end anywhere. Values may be negative. Return the best path sum.\n\nExample\nbestTreePath([-10, 9, 20, null, null, 15, 7]) returns 42.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "fairest-split",
    "difficulty": "hard",
    "title": "Fairest split",
    "prompt": "Fairest split\n\nWrite `fairestSplit(values: number[], parts: number): number`.\n\nTopic: binary search. Split the array into parts non-empty contiguous parts, in order. Minimize the largest part sum and return it.\n\nExample\nfairestSplit([7, 2, 5, 10, 8], 2) returns 18.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "kth-in-sorted-grid",
    "difficulty": "hard",
    "title": "Kth in a sorted grid",
    "prompt": "Kth in a sorted grid\n\nWrite `kthInSortedGrid(grid: number[][], k: number): number`.\n\nTopic: binary search. The grid is square. Rows and columns are sorted ascending. Return the kth smallest value, from 1.\n\nExample\nkthInSortedGrid([[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8) returns 13.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "kth-pair-gap",
    "difficulty": "hard",
    "title": "Kth pair gap",
    "prompt": "Kth pair gap\n\nWrite `kthPairGap(values: number[], k: number): number`.\n\nTopic: binary search. Return the kth smallest absolute difference between two different indexes, counting from 1.\n\nExample\nkthPairGap([1, 3, 1], 1) returns 0.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "inserts-for-pal",
    "difficulty": "hard",
    "title": "Inserts to make a palindrome",
    "prompt": "Inserts to make a palindrome\n\nWrite `insertsForPalindrome(text: string): number`.\n\nTopic: dynamic programming. Return the fewest insertions that make text a palindrome.\n\nExample\ninsertsForPalindrome('mbadm') returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bridge-count",
    "difficulty": "hard",
    "title": "Bridge count",
    "prompt": "Bridge count\n\nWrite `bridgeCount(n: number, edges: [number, number][]): number`.\n\nTopic: graphs. Count undirected bridges among nodes 0 through n-1.\n\nExample\nbridgeCount(4, [[0, 1], [1, 2], [2, 0], [1, 3]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cut-vertices",
    "difficulty": "hard",
    "title": "Cut vertices",
    "prompt": "Cut vertices\n\nWrite `cutVertices(n: number, edges: [number, number][]): number`.\n\nTopic: graphs. Count articulation points in an undirected graph.\n\nExample\ncutVertices(5, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "strong-parts",
    "difficulty": "hard",
    "title": "Strong parts",
    "prompt": "Strong parts\n\nWrite `strongParts(n: number, edges: [number, number][]): number`.\n\nTopic: graphs. Directed edges. Return the number of strongly connected components.\n\nExample\nstrongParts(5, [[1, 0], [0, 2], [2, 1], [0, 3], [3, 4]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "negative-hop",
    "difficulty": "hard",
    "title": "Hop with negative edges",
    "prompt": "Hop with negative edges\n\nWrite `negativeHop(n: number, edges: [number, number, number][], source: number, target: number): number`.\n\nTopic: Bellman-Ford. Return the cheapest cost, -1 if unreachable, or -2 if a negative cycle can improve the route.\n\nExample\nnegativeHop(4, [[0, 1, 1], [1, 2, -2], [2, 3, 1]], 0, 3) returns 0.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rising-chain-count",
    "difficulty": "hard",
    "title": "Rising chain count",
    "prompt": "Rising chain count\n\nWrite `risingChainCount(values: number[]): number`.\n\nTopic: dynamic programming. Count the longest strictly increasing subsequences. Different index lists count separately.\n\nExample\nrisingChainCount([1, 3, 5, 4, 7]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "nested-envelopes",
    "difficulty": "hard",
    "title": "Nested envelopes",
    "prompt": "Nested envelopes\n\nWrite `nestedEnvelopes(envelopes: [number, number][]): number`.\n\nTopic: dynamic programming. An envelope fits in another only when width and height are both strictly smaller. Return the longest nest.\n\nExample\nnestedEnvelopes([[5, 4], [6, 4], [6, 7], [2, 3]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "matrix-multiply-cost",
    "difficulty": "hard",
    "title": "Matrix multiply cost",
    "prompt": "Matrix multiply cost\n\nWrite `matrixMultiplyCost(dims: number[]): number`.\n\nTopic: dynamic programming. Matrix i is dims[i] by dims[i+1]. Return the fewest scalar multiplications.\n\nExample\nmatrixMultiplyCost([10, 20, 30, 40]) returns 18000.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "egg-drops",
    "difficulty": "hard",
    "title": "Egg drops",
    "prompt": "Egg drops\n\nWrite `eggDrops(eggs: number, floors: number): number`.\n\nTopic: dynamic programming. Return the fewest drops that guarantee finding the critical floor.\n\nExample\neggDrops(2, 6) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "crate-burst",
    "difficulty": "hard",
    "title": "Crate burst score",
    "prompt": "Crate burst score\n\nWrite `crateBurst(scores: number[]): number`.\n\nTopic: dynamic programming. Bursting a crate earns the product of its current neighbors. A missing neighbor is 1. Return the best total.\n\nExample\ncrateBurst([3, 1, 5, 8]) returns 167.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "stick-cuts",
    "difficulty": "hard",
    "title": "Stick cuts",
    "prompt": "Stick cuts\n\nWrite `stickCuts(length: number, cuts: number[]): number`.\n\nTopic: dynamic programming. A cut costs the current piece length. Perform every cut. Return the minimum cost.\n\nExample\nstickCuts(7, [1, 3, 4, 5]) returns 16.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "dungeon-health",
    "difficulty": "hard",
    "title": "Dungeon health",
    "prompt": "Dungeon health\n\nWrite `dungeonHealth(grid: number[][]): number`.\n\nTopic: dynamic programming. Move only right or down. Health stays at least 1 before every cell. Return the minimum start.\n\nExample\ndungeonHealth([[-2, -3, 3], [-5, -10, 1], [10, 30, -5]]) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "walk-off-grid",
    "difficulty": "hard",
    "title": "Walk off the grid",
    "prompt": "Walk off the grid\n\nWrite `walkOffGrid(rows: number, cols: number, moves: number, startRow: number, startCol: number): number`.\n\nTopic: dynamic programming. Count ways to step off the grid within the move budget, modulo 1000000007.\n\nExample\nwalkOffGrid(2, 2, 2, 0, 0) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "quiet-board-count",
    "difficulty": "hard",
    "title": "Quiet board count",
    "prompt": "Quiet board count\n\nWrite `quietBoardCount(n: number): number`.\n\nTopic: backtracking. Count placements of n queens with no shared row, column, or diagonal.\n\nExample\nquietBoardCount(4) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "wildcard-match",
    "difficulty": "hard",
    "title": "Wildcard match",
    "prompt": "Wildcard match\n\nWrite `wildcardMatch(text: string, pattern: string): boolean`.\n\nTopic: dynamic programming. '?' is one character and '*' is any sequence. Match the whole text.\n\nExample\nwildcardMatch('adceb', '*a*b') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "token-pattern",
    "difficulty": "hard",
    "title": "Token pattern",
    "prompt": "Token pattern\n\nWrite `tokenPattern(text: string, pattern: string): boolean`.\n\nTopic: dynamic programming. '.' is one character and '*' repeats the previous token. Match the whole text.\n\nExample\ntokenPattern('aab', 'c*a*b') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "subseq-ways",
    "difficulty": "hard",
    "title": "Subsequence ways",
    "prompt": "Subsequence ways\n\nWrite `subseqWays(source: string, target: string): number`.\n\nTopic: dynamic programming. Count subsequences of source equal to target.\n\nExample\nsubseqWays('rabbbit', 'rabbit') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "shortest-superseq",
    "difficulty": "hard",
    "title": "Shortest common supersequence length",
    "prompt": "Shortest common supersequence length\n\nWrite `shortestSuperLength(a: string, b: string): number`.\n\nTopic: dynamic programming. Return the length of the shortest common supersequence.\n\nExample\nshortestSuperLength('abac', 'cab') returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "histogram-area",
    "difficulty": "hard",
    "title": "Histogram area",
    "prompt": "Histogram area\n\nWrite `histogramArea(heights: number[]): number`.\n\nTopic: stack. Bars have width 1. Return the largest rectangle.\n\nExample\nhistogramArea([2,1,5,6,2,3]) returns 10.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "caught-rain",
    "difficulty": "hard",
    "title": "Caught rain",
    "prompt": "Caught rain\n\nWrite `caughtRain(heights: number[]): number`.\n\nTopic: two pointers. Water rises to the lower bounding bar. Return the units held.\n\nExample\ncaughtRain([0,1,0,2,1,0,1,3,2,1,2,1]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "inversion-count",
    "difficulty": "hard",
    "title": "Inversion count",
    "prompt": "Inversion count\n\nWrite `inversionCount(values: number[]): number`.\n\nTopic: divide and conquer. Count pairs i < j with a larger value first.\n\nExample\ninversionCount([2,4,1,3,5]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cover-length",
    "difficulty": "hard",
    "title": "Cover length",
    "prompt": "Cover length\n\nWrite `coverLength(log: string, need: string): number`.\n\nTopic: sliding window. Return the length of the shortest slice of log that covers every character of need with at least the required counts. Return 0 if none exists.\n\nExample\ncoverLength('ADOBECODEBANC', 'ABC') returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "slice-minimums",
    "difficulty": "hard",
    "title": "Sum of slice minimums",
    "prompt": "Sum of slice minimums\n\nWrite `sliceMinimums(values: number[]): number`.\n\nTopic: stack. Sum, over every contiguous slice, the minimum value in that slice. Return the total modulo 1000000007.\n\nExample\nsliceMinimums([3, 1, 2, 4]) returns 17.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "quartet-count",
    "difficulty": "hard",
    "title": "Quartet count",
    "prompt": "Quartet count\n\nWrite `quartetCount(values: number[], target: number): number`.\n\nTopic: two pointers. Count unordered selections of four different indexes that add to target. Identical multisets count once.\n\nExample\nquartetCount([1, 0, -1, 0, -2, 2], 0) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "patch-range",
    "difficulty": "hard",
    "title": "Patch the range",
    "prompt": "Patch the range\n\nWrite `patchRange(values: number[], n: number): number`.\n\nTopic: greedy. values is a sorted list of positive integers. You may insert numbers. Return the fewest inserts so every integer from 1 through n can be formed as a sum of a subset.\n\nExample\npatchRange([1, 3], 6) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "word-strip-starts",
    "difficulty": "hard",
    "title": "Concatenated word starts",
    "prompt": "Concatenated word starts\n\nWrite `wordStripStarts(text: string, words: string[]): number[]`.\n\nTopic: sliding window. words are the same length. Return every index where a concatenation of each word exactly once begins. Order the indexes ascending.\n\nExample\nwordStripStarts('barfoothefoobarman', ['foo', 'bar']) returns [0, 9].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "one-flip-island",
    "difficulty": "hard",
    "title": "Largest island after one flip",
    "prompt": "Largest island after one flip\n\nWrite `oneFlipIsland(grid: number[][]): number`.\n\nTopic: graphs. You may change one 0 to 1. Return the largest island you can make. Doing nothing is allowed.\n\nExample\noneFlipIsland([[1,0],[0,1]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "rising-water",
    "difficulty": "hard",
    "title": "Path through rising water",
    "prompt": "Path through rising water\n\nWrite `risingWater(grid: number[][]): number`.\n\nTopic: graphs. At time t you may step on cells whose value is at most t. Move to edge neighbors. Return the earliest time you can reach the bottom-right from the top-left. You may wait.\n\nExample\nrisingWater([[0,2],[1,3]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "equal-k-parts",
    "difficulty": "hard",
    "title": "K equal parts",
    "prompt": "K equal parts\n\nWrite `canPartitionK(values: number[], k: number): boolean`.\n\nTopic: backtracking. Return whether the values can be split into k groups with the same sum.\n\nExample\ncanPartitionK([4, 3, 2, 3, 5, 2, 1], 4) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "common-free-time",
    "difficulty": "hard",
    "title": "Common free time",
    "prompt": "Common free time\n\nWrite `commonFreeTime(schedules: [number, number][][]): [number, number][]`.\n\nTopic: intervals. Each person has sorted busy intervals [start, end). Return the positive-length gaps when everyone is free, between the first and last busy time, sorted.\n\nExample\ncommonFreeTime([[[1, 2], [5, 6]], [[1, 3]], [[4, 10]]]) returns [[3, 4]].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "course-deadline",
    "difficulty": "hard",
    "title": "Courses before deadlines",
    "prompt": "Courses before deadlines\n\nWrite `coursesBeforeDeadline(courses: [number, number][]): number`.\n\nTopic: heaps. A course is [duration, lastDay] and must finish on or before lastDay. You start at day 0 and take one course at a time. Return the most courses you can finish.\n\nExample\ncoursesBeforeDeadline([[100, 200], [200, 1300], [1000, 1250], [2000, 3200]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "startup-capital",
    "difficulty": "hard",
    "title": "Startup capital",
    "prompt": "Startup capital\n\nWrite `startupCapital(picks: number, capital: number, profits: number[], costs: number[]): number`.\n\nTopic: heaps. Project i needs costs[i] capital on hand and then adds profits[i]. You may complete at most picks projects. Return the most capital you can reach, starting from capital.\n\nExample\nstartupCapital(2, 0, [1, 2, 3], [0, 1, 1]) returns 4.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "chars-to-palindrome",
    "difficulty": "hard",
    "title": "Characters to prepend",
    "prompt": "Characters to prepend\n\nWrite `charsToPalindrome(text: string): number`.\n\nTopic: strings. Return how many characters you must prepend so text becomes a palindrome.\n\nExample\ncharsToPalindrome('aacecaaa') returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "edit-cost",
    "difficulty": "hard",
    "title": "Edit cost",
    "prompt": "Edit cost\n\nWrite `editCost(left: string, right: string): number`.\n\nTopic: DP. An edit inserts, deletes, or replaces one character. Return the fewest edits that turn left into right.\n\nExample\neditCost('horse', 'ros') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cheapest-hops",
    "difficulty": "hard",
    "title": "Cheapest route with a hop cap",
    "prompt": "Cheapest route with a hop cap\n\nWrite `cheapestHops(cities: number, flights: [number, number, number][], start: number, end: number, stops: number): number`.\n\nTopic: graphs. A flight is [from, to, price]. You may take at most stops layovers, so at most stops+1 flights. Return the cheapest price, or -1.\n\nExample\ncheapestHops(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1) returns 700.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "word-ladder-length",
    "difficulty": "hard",
    "title": "Word ladder length",
    "prompt": "Word ladder length\n\nWrite `wordLadderLength(begin: string, end: string, words: string[]): number`.\n\nTopic: BFS. Each step changes one letter and must land on a word in words. Return the length of the shortest ladder including begin, or 0 if end is unreachable.\n\nExample\nwordLadderLength('hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "cuts-to-mirror",
    "difficulty": "hard",
    "title": "Deletions to a mirror",
    "prompt": "Deletions to a mirror\n\nWrite `deletionsToMirror(text: string): number`.\n\nTopic: DP. Delete as few characters as possible so the rest reads the same forward and backward. Return that count.\n\nExample\ndeletionsToMirror('aebcbda') returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "mirror-cuts",
    "difficulty": "hard",
    "title": "Mirror cuts",
    "prompt": "Mirror cuts\n\nWrite `mirrorCuts(text: string): number`.\n\nTopic: DP. Cut the text into pieces that each read the same forward and backward. Return the fewest cuts. A string that is already a mirror needs 0.\n\nExample\nmirrorCuts('aab') returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "trapped-rain",
    "difficulty": "hard",
    "title": "Trapped rain",
    "prompt": "Trapped rain\n\nWrite `trappedRain(heights: number[]): number`.\n\nTopic: two pointers. heights are bar heights of width 1. Return how many units of water the bars can trap.\n\nExample\ntrappedRain([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "window-peaks",
    "difficulty": "hard",
    "title": "Window peaks",
    "prompt": "Window peaks\n\nWrite `windowPeaks(values: number[], width: number): number[]`.\n\nTopic: deque. Return the maximum of every contiguous window of the given width, from left to right.\n\nExample\nwindowPeaks([1, 3, -1, -3, 5, 3, 6, 7], 3) returns [3, 3, 5, 5, 6, 7].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-rising-count",
    "difficulty": "hard",
    "title": "Count of longest rises",
    "prompt": "Count of longest rises\n\nWrite `countLongestRises(values: number[]): number`.\n\nTopic: DP. Count strictly increasing subsequences whose length equals the longest such subsequence.\n\nExample\ncountLongestRises([1, 3, 5, 4, 7]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-split-largest",
    "difficulty": "hard",
    "title": "Fairest split sum",
    "prompt": "Fairest split sum\n\nWrite `fairestSplitSum(values: number[], parts: number): number`.\n\nTopic: binary search. Split into parts non-empty contiguous parts. Minimize the largest part sum.\n\nExample\nfairestSplitSum([7, 2, 5, 10, 8], 2) returns 18.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-two-medians",
    "difficulty": "hard",
    "title": "Combined median",
    "prompt": "Combined median\n\nWrite `combinedMedian(left: number[], right: number[]): number`.\n\nTopic: binary search. Both inputs are sorted. Return the median. Average the two middle values when the count is even.\n\nExample\ncombinedMedian([1, 3], [2]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-dungeon",
    "difficulty": "hard",
    "title": "Starting health",
    "prompt": "Starting health\n\nWrite `startingHealth(grid: number[][]): number`.\n\nTopic: DP. Health changes by the room value and must stay at least 1. Move only right or down. Return the least starting health.\n\nExample\nstartingHealth([[-2, -3, 3], [-5, -10, 1], [10, 30, -5]]) returns 7.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-leave-grid",
    "difficulty": "hard",
    "title": "Walks that leave",
    "prompt": "Walks that leave\n\nWrite `walksThatLeave(rows: number, cols: number, moves: number, startRow: number, startCol: number): number`.\n\nTopic: DP. Each step moves to an edge neighbor. Count walks of exactly moves steps that stay inside until the last step, which leaves the grid. Modulo 1000000007.\n\nExample\nwalksThatLeave(2, 2, 2, 0, 0) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-vowel-strings",
    "difficulty": "hard",
    "title": "Vowel chain count",
    "prompt": "Vowel chain count\n\nWrite `vowelChainCount(length: number): number`.\n\nTopic: DP. Follow a to e, e to a or i, i to a e o or u, o to i or u, and u to a. Count strings of that length, modulo 1000000007.\n\nExample\nvowelChainCount(2) returns 10.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-card-points",
    "difficulty": "hard",
    "title": "Draw until stop",
    "prompt": "Draw until stop\n\nWrite `drawUntilStop(stop: number, maxDraw: number, goal: number): number`.\n\nTopic: DP. Draw a uniform integer from 1 through maxDraw while the total is below stop. Return the probability of finishing at or above goal, rounded to 5 decimals in the example.\n\nExample\ndrawUntilStop(10, 1, 10) returns 0.1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-egg-drops",
    "difficulty": "hard",
    "title": "Guaranteed egg drops",
    "prompt": "Guaranteed egg drops\n\nWrite `guaranteedEggDrops(eggs: number, floors: number): number`.\n\nTopic: DP. Return the fewest drops that guarantee finding the highest safe floor among floors, with the given eggs.\n\nExample\nguaranteedEggDrops(2, 6) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-stick-cuts",
    "difficulty": "hard",
    "title": "Cut cost of a stick",
    "prompt": "Cut cost of a stick\n\nWrite `cutCostOfStick(length: number, cuts: number[]): number`.\n\nTopic: DP. Cutting a current piece costs its length. Return the least cost of performing every cut.\n\nExample\ncutCostOfStick(7, [1, 3, 4, 5]) returns 16.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-balloon-score",
    "difficulty": "hard",
    "title": "Burst score",
    "prompt": "Burst score\n\nWrite `burstScore(values: number[]): number`.\n\nTopic: DP. Bursting a balloon scores its value times the nearest balloons still standing. Outside ends are 1. Return the best score.\n\nExample\nburstScore([3, 1, 5, 8]) returns 167.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-printer-turns",
    "difficulty": "hard",
    "title": "Repeated print turns",
    "prompt": "Repeated print turns\n\nWrite `repeatedPrintTurns(text: string): number`.\n\nTopic: DP. One turn prints the same character any positive number of times. Return the fewest turns.\n\nExample\nrepeatedPrintTurns('aaabbb') returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-subseq-ways",
    "difficulty": "hard",
    "title": "Target subsequence count",
    "prompt": "Target subsequence count\n\nWrite `targetSubsequenceCount(text: string, target: string): number`.\n\nTopic: DP. Count subsequences of text equal to target.\n\nExample\ntargetSubsequenceCount('rabbbit', 'rabbit') returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-pattern-match",
    "difficulty": "hard",
    "title": "Dot and star match",
    "prompt": "Dot and star match\n\nWrite `dotStarMatch(text: string, pattern: string): boolean`.\n\nTopic: DP. A dot matches one character. A star matches zero or more of the character before it. Match the whole text.\n\nExample\ndotStarMatch('aab', 'c*a*b') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-wild-match",
    "difficulty": "hard",
    "title": "Star wildcard",
    "prompt": "Star wildcard\n\nWrite `starWildcard(text: string, pattern: string): boolean`.\n\nTopic: DP. Question mark matches one character. Star matches any run, including empty. Match the whole text.\n\nExample\nstarWildcard('adceb', '*a*b') returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-max-rectangle",
    "difficulty": "hard",
    "title": "Rectangle of ones",
    "prompt": "Rectangle of ones\n\nWrite `rectangleOfOnes(grid: string[][]): number`.\n\nTopic: stack. Return the area of the largest solid rectangle of the character 1.\n\nExample\nrectangleOfOnes([['1','0','1','0','0'],['1','0','1','1','1'],['1','1','1','1','1'],['1','0','0','1','0']]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-first-missing",
    "difficulty": "hard",
    "title": "Smallest missing positive",
    "prompt": "Smallest missing positive\n\nWrite `smallestMissingPositive(values: number[]): number`.\n\nTopic: arrays. Return the smallest positive integer that does not occur.\n\nExample\nsmallestMissingPositive([3, 4, -1, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-quiet-queens",
    "difficulty": "hard",
    "title": "Non-attacking queens",
    "prompt": "Non-attacking queens\n\nWrite `nonAttackingQueens(n: number): number`.\n\nTopic: backtracking. Count ways to place n queens on an n by n board with no shared row, column, or diagonal.\n\nExample\nnonAttackingQueens(4) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-operator-count",
    "difficulty": "hard",
    "title": "Inserted operator count",
    "prompt": "Inserted operator count\n\nWrite `insertedOperatorCount(digits: string, target: number): number`.\n\nTopic: backtracking. Place +, -, or * between digits, or join them. Count expressions equal to target. Joined numbers cannot have a leading zero.\n\nExample\ninsertedOperatorCount('123', 6) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-critical-links",
    "difficulty": "hard",
    "title": "Bridges in a network",
    "prompt": "Bridges in a network\n\nWrite `bridgesInNetwork(nodes: number, links: [number, number][]): number`.\n\nTopic: graphs. Count undirected links whose removal disconnects some pair that was connected.\n\nExample\nbridgesInNetwork(4, [[0,1],[1,2],[2,0],[1,3]]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-connect-time",
    "difficulty": "hard",
    "title": "Earliest full connection",
    "prompt": "Earliest full connection\n\nWrite `earliestFullConnection(nodes: number, offers: [number, number, number][]): number`.\n\nTopic: union-find. offers are [a, b, time]. Return the earliest time all nodes connect, or -1.\n\nExample\nearliestFullConnection(4, [[0,1,3],[2,3,4],[0,3,5],[1,2,6]]) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-billboard",
    "difficulty": "hard",
    "title": "Equal support height",
    "prompt": "Equal support height\n\nWrite `equalSupportHeight(rods: number[]): number`.\n\nTopic: DP. Place each rod left, right, or aside. Return the greatest equal height.\n\nExample\nequalSupportHeight([1,2,3,6]) returns 6.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-tap-range",
    "difficulty": "hard",
    "title": "Fewest taps",
    "prompt": "Fewest taps\n\nWrite `fewestTaps(length: number, ranges: number[]): number`.\n\nTopic: greedy. Tap i covers i-ranges[i] through i+ranges[i] inside 0..length. Return the fewest taps, or -1.\n\nExample\nfewestTaps(5, [3,4,1,1,0,0]) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-line-points",
    "difficulty": "hard",
    "title": "Collinear points",
    "prompt": "Collinear points\n\nWrite `collinearPoints(points: [number, number][]): number`.\n\nTopic: geometry. Return how many of the points lie on one line, at most.\n\nExample\ncollinearPoints([[1,1],[2,2],[3,3]]) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay-self-cross",
    "difficulty": "hard",
    "title": "Path crosses itself",
    "prompt": "Path crosses itself\n\nWrite `pathCrossesItself(steps: number[]): boolean`.\n\nTopic: geometry. Walk north, west, south, east, repeating. Return whether the path visits a point twice.\n\nExample\npathCrossesItself([2,1,1,2]) returns true.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-pigs",
    "difficulty": "hard",
    "title": "Fewest testers",
    "prompt": "Fewest testers\n\nWrite `fewestTesters(buckets: number, dieMinutes: number, minutes: number): number`.\n\nTopic: math. One bucket is bad. A tester dies dieMinutes after tasting it. You have minutes. Return the fewest testers.\n\nExample\nfewestTesters(1000, 15, 60) returns 5.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-replace",
    "difficulty": "hard",
    "title": "Steps down to one",
    "prompt": "Steps down to one\n\nWrite `stepsDownToOne(n: number): number`.\n\nTopic: greedy. Halve evens. Add or subtract 1 from odds. Return the fewest steps to 1.\n\nExample\nstepsDownToOne(8) returns 3.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-range",
    "difficulty": "hard",
    "title": "Slice sums in a band",
    "prompt": "Slice sums in a band\n\nWrite `sliceSumsInBand(values: number[], low: number, high: number): number`.\n\nTopic: divide and conquer. Count slices whose sum lies between low and high.\n\nExample\nsliceSumsInBand([-2, 5, -1], -2, 2) returns 1.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-rpairs",
    "difficulty": "hard",
    "title": "Doubled reverse pairs",
    "prompt": "Doubled reverse pairs\n\nWrite `doubledReversePairs(values: number[]): number`.\n\nTopic: divide and conquer. Count i < j with values[i] > 2 * values[j].\n\nExample\ndoubledReversePairs([1, 3, 2, 3, 1]) returns 2.\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  },
  {
    "key": "bay2-smaller",
    "difficulty": "hard",
    "title": "Later smaller counts",
    "prompt": "Later smaller counts\n\nWrite `laterSmallerCounts(values: number[]): number[]`.\n\nTopic: divide and conquer. For each index return how many later values are strictly smaller.\n\nExample\nlaterSmallerCounts([5, 2, 6, 1]) returns [2, 1, 1, 0].\n\nUse any supported programming language in the editor. A correct result for the stated rules is what a reviewer grades. State the approach in a short comment if the code is not obvious. These prompts were written for this bank. They are not items from another site."
  }
];
