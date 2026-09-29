
def register(add):
    def kadane(a):
        best = cur = a[0]
        for x in a[1:]:
            cur = max(x, cur + x)
            best = max(best, cur)
        return best
    def max_product(a):
        best = hi = lo = a[0]
        for x in a[1:]:
            hi, lo = max(x, hi * x, lo * x), min(x, hi * x, lo * x)
            best = max(best, hi)
        return best
    def circular(a):
        total = sum(a)
        best = cur = worst = wcur = a[0]
        for x in a[1:]:
            cur = max(x, cur + x); best = max(best, cur)
            wcur = min(x, wcur + x); worst = min(worst, wcur)
        return best if best < 0 else max(best, total - worst)
    def two_sum_sorted(a, t):
        i, j = 0, len(a) - 1
        while i < j:
            s = a[i] + a[j]
            if s == t: return [i, j]
            if s < t: i += 1
            else: j -= 1
        return None
    def three_closest(a, t):
        b = sorted(a)
        best = b[0] + b[1] + b[2]
        for i in range(len(b)):
            l, r = i + 1, len(b) - 1
            while l < r:
                s = b[i] + b[l] + b[r]
                if abs(s - t) < abs(best - t): best = s
                if s < t: l += 1
                elif s > t: r -= 1
                else: return s
        return best
    def three_count(a, t):
        b = sorted(a); n = 0
        for i in range(len(b)):
            if i and b[i] == b[i - 1]: continue
            l, r = i + 1, len(b) - 1
            while l < r:
                s = b[i] + b[l] + b[r]
                if s == t:
                    n += 1; l += 1; r -= 1
                    while l < r and b[l] == b[l - 1]: l += 1
                    while l < r and b[r] == b[r + 1]: r -= 1
                elif s < t: l += 1
                else: r -= 1
        return n
    def container(h):
        i, j, best = 0, len(h) - 1, 0
        while i < j:
            best = max(best, min(h[i], h[j]) * (j - i))
            if h[i] < h[j]: i += 1
            else: j -= 1
        return best
    def move_zero(a):
        out = [n for n in a if n]
        return out + [0] * (len(a) - len(out))
    def plus_one(d):
        a = d[:]
        for i in range(len(a) - 1, -1, -1):
            if a[i] < 9:
                a[i] += 1
                return a
            a[i] = 0
        return [1] + a
    def rotate(a, k):
        r = k % len(a)
        return a[-r:] + a[:-r] if r else a[:]
    def squares(a):
        return sorted(n * n for n in a)
    def merge(a, b):
        i = j = 0; out = []
        while i < len(a) or j < len(b):
            if j >= len(b) or (i < len(a) and a[i] <= b[j]):
                out.append(a[i]); i += 1
            else:
                out.append(b[j]); j += 1
        return out
    def dedupe(a):
        if not a: return 0
        w = 1
        for i in range(1, len(a)):
            if a[i] != a[w - 1]: w += 1
        return w
    def has_dup(a):
        return len(set(a)) != len(a)
    def nearby(a, k):
        seen = {}
        for i, n in enumerate(a):
            if n in seen and i - seen[n] <= k: return True
            seen[n] = i
        return False
    def nearby_almost(a, index_diff, value_diff):
        bucket = {}; w = value_diff + 1
        for i, n in enumerate(a):
            bid = n // w
            if bid in bucket: return True
            if bid - 1 in bucket and abs(n - bucket[bid - 1]) <= value_diff: return True
            if bid + 1 in bucket and abs(n - bucket[bid + 1]) <= value_diff: return True
            bucket[bid] = n
            if i >= index_diff:
                old = a[i - index_diff] // w
                bucket.pop(old, None)
        return False
    def flip_words(s):
        return " ".join(s.split()[::-1])
    def loose_pal(s):
        t = "".join(ch.lower() for ch in s if ch.isalnum())
        return t == t[::-1]
    def almost_pal(s):
        def ok(i, j):
            while i < j:
                if s[i] != s[j]: return False
                i += 1; j -= 1
            return True
        i, j = 0, len(s) - 1
        while i < j:
            if s[i] != s[j]:
                return ok(i + 1, j) or ok(i, j - 1)
            i += 1; j -= 1
        return True
    def brackets(s):
        pair = {")": "(", "]": "[", "}": "{"}
        st = []
        for c in s:
            if c in "([{": st.append(c)
            elif not st or st.pop() != pair[c]: return False
        return not st
    def roman(s):
        v = dict(I=1, V=5, X=10, L=50, C=100, D=500, M=1000)
        n = 0
        for i, c in enumerate(s):
            cur, nxt = v[c], v[s[i + 1]] if i + 1 < len(s) else 0
            n += -cur if cur < nxt else cur
        return n
    def write_roman(num):
        pairs = [(1000,"M"),(900,"CM"),(500,"D"),(400,"CD"),(100,"C"),(90,"XC"),(50,"L"),(40,"XL"),(10,"X"),(9,"IX"),(5,"V"),(4,"IV"),(1,"I")]
        out = []
        for val, sym in pairs:
            while num >= val:
                out.append(sym); num -= val
        return "".join(out)
    def col_title(n):
        s = ""
        while n:
            n -= 1
            s = chr(65 + n % 26) + s
            n //= 26
        return s
    def col_index(s):
        n = 0
        for c in s:
            n = n * 26 + ord(c) - 64
        return n
    def happy(n):
        seen = set()
        while n != 1 and n not in seen:
            seen.add(n)
            n = sum(int(d) ** 2 for d in str(n))
        return n == 1
    def trailing(n):
        c = 0
        while n:
            n //= 5
            c += n
        return c
    def isqrt(n):
        lo, hi = 0, n
        while lo <= hi:
            mid = (lo + hi) // 2
            if mid * mid <= n: lo = mid + 1
            else: hi = mid - 1
        return hi
    def add_bin(a, b):
        i, j, carry, out = len(a) - 1, len(b) - 1, 0, []
        while i >= 0 or j >= 0 or carry:
            s = carry
            if i >= 0: s += ord(a[i]) - 48; i -= 1
            if j >= 0: s += ord(b[j]) - 48; j -= 1
            out.append(str(s % 2)); carry = s // 2
        return "".join(reversed(out))
    def bits(n):
        c = 0
        while n:
            n &= n - 1
            c += 1
        return c
    def climb(n):
        a = b = 1
        for _ in range(n):
            a, b = b, a + b
        return a
    def toll(cost):
        a = b = 0
        for c in cost:
            a, b = b, c + min(a, b)
        return min(a, b)
    def rob(a):
        prev = cur = 0
        for n in a:
            prev, cur = cur, max(cur, prev + n)
        return cur
    def rob_circ(a):
        if len(a) == 1: return a[0]
        return max(rob(a[:-1]), rob(a[1:]))
    def delete_earn(a):
        gain = [0] * (max(a) + 1)
        for n in a: gain[n] += n
        return rob(gain)
    def coin(coins, amount):
        dp = [0] + [10 ** 9] * amount
        for c in coins:
            for x in range(c, amount + 1):
                dp[x] = min(dp[x], dp[x - c] + 1)
        return -1 if dp[amount] >= 10 ** 9 else dp[amount]
    def coin_ways(coins, amount):
        dp = [1] + [0] * amount
        for c in coins:
            for x in range(c, amount + 1):
                dp[x] += dp[x - c]
        return dp[amount]
    def squares_n(n):
        dp = [0] + [10 ** 9] * n
        for i in range(1, n + 1):
            s = 1
            while s * s <= i:
                dp[i] = min(dp[i], dp[i - s * s] + 1)
                s += 1
        return dp[n]
    def integer_break(n):
        dp = [0] * (n + 1)
        for i in range(2, n + 1):
            for j in range(1, i):
                dp[i] = max(dp[i], max(j, dp[j]) * max(i - j, dp[i - j]))
        return dp[n]
    def unique_bst(n):
        dp = [1] + [0] * n
        for nodes in range(1, n + 1):
            for left in range(nodes):
                dp[nodes] += dp[left] * dp[nodes - 1 - left]
        return dp[n]
    def lis(a):
        tails = []
        import bisect
        for n in a:
            i = bisect.bisect_left(tails, n)
            if i == len(tails): tails.append(n)
            else: tails[i] = n
        return len(tails)
    def lcs(a, b):
        dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
        for i in range(1, len(a) + 1):
            for j in range(1, len(b) + 1):
                dp[i][j] = dp[i - 1][j - 1] + 1 if a[i - 1] == b[j - 1] else max(dp[i - 1][j], dp[i][j - 1])
        return dp[-1][-1]
    def lcsub(a, b):
        best = 0
        dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
        for i in range(1, len(a) + 1):
            for j in range(1, len(b) + 1):
                if a[i - 1] == b[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                    best = max(best, dp[i][j])
        return best
    def edit(a, b):
        dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
        for i in range(len(a) + 1): dp[i][0] = i
        for j in range(len(b) + 1): dp[0][j] = j
        for i in range(1, len(a) + 1):
            for j in range(1, len(b) + 1):
                dp[i][j] = dp[i - 1][j - 1] if a[i - 1] == b[j - 1] else 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        return dp[-1][-1]
    def pivot(a):
        total = sum(a); left = 0
        for i, n in enumerate(a):
            if left == total - left - n: return i
            left += n
        return -1
    def majority(a):
        cand = count = 0
        for n in a:
            if count == 0: cand = n
            count += 1 if n == cand else -1
        return cand
    def majority2(a):
        c1 = c2 = None; n1 = n2 = 0
        for n in a:
            if n == c1: n1 += 1
            elif n == c2: n2 += 1
            elif n1 == 0: c1, n1 = n, 1
            elif n2 == 0: c2, n2 = n, 1
            else: n1 -= 1; n2 -= 1
        n1 = sum(n == c1 for n in a)
        n2 = sum(n == c2 for n in a)
        out = []
        if c1 is not None and n1 > len(a) / 3: out.append(c1)
        if c2 is not None and n2 > len(a) / 3 and c2 != c1: out.append(c2)
        return sorted(out)
    def missing(a):
        n = len(a); x = n
        for i, v in enumerate(a):
            x ^= i ^ v
        return x
    def first_missing(a):
        b = a[:]; n = len(b)
        for i in range(n):
            while 1 <= b[i] <= n and b[b[i] - 1] != b[i]:
                j = b[i] - 1
                b[i], b[j] = b[j], b[i]
        for i, v in enumerate(b):
            if v != i + 1: return i + 1
        return n + 1
    def single(a):
        x = 0
        for n in a: x ^= n
        return x
    def single3(a):
        ones = twos = 0
        for n in a:
            ones = (ones ^ n) & ~twos
            twos = (twos ^ n) & ~ones
        return ones
    def prefix(strs):
        p = strs[0]
        for s in strs:
            while not s.startswith(p):
                p = p[:-1]
        return p
    add("easy", "even-index-sum", "Even index sum", "evenIndexSum(values: number[]): number",
        "Topic: arrays. Return the sum of values at even indexes. An empty list sums to 0.",
        "evenIndexSum([4, 9, 1, 7, 3])", 4 + 1 + 3)
    add("easy", "best-shift-run", "Best shift run", "bestRun(values: number[]): number",
        "Topic: arrays, dynamic programming. values[i] is a gain or a loss. Return the largest sum of any contiguous run of at least one value.",
        "bestRun([-2, 3, -1, 4, -5])", kadane([-2, 3, -1, 4, -5]))
    add("medium", "best-product-run", "Best product run", "bestProductRun(values: number[]): number",
        "Topic: arrays, dynamic programming. Return the largest product of any contiguous run. Values may be negative, and a run has at least one value.",
        "bestProductRun([2, 3, -2, 4])", max_product([2, 3, -2, 4]))
    add("medium", "circular-run", "Circular shift run", "circularRun(values: number[]): number",
        "Topic: arrays. The line is circular, so a run may wrap once. Do not reuse a value. Return the largest contiguous sum.",
        "circularRun([5, -3, 5])", circular([5, -3, 5]))
    add("easy", "sorted-pair", "Sorted pair", "sortedPair(weights: number[], target: number): [number, number] | null",
        "Topic: two pointers. weights is sorted ascending. Return indexes of two different values that add to target, or null. Prefer the smaller left index.",
        "sortedPair([1, 3, 4, 7, 11], 11)", two_sum_sorted([1, 3, 4, 7, 11], 11))
    add("medium", "closest-trio", "Closest trio", "closestTrio(weights: number[], target: number): number",
        "Topic: two pointers. Return the sum of three different values that is closest to target.",
        "closestTrio([-1, 2, 1, -4], 1)", three_closest([-1, 2, 1, -4], 1))
    add("medium", "trio-count", "Trio count", "trioCount(weights: number[], target: number): number",
        "Topic: two pointers. Count unordered triples of distinct indexes that add to target. Identical value multisets count once.",
        "trioCount([-1, 0, 1, 2, -1, -4], 0)", three_count([-1, 0, 1, 2, -1, -4], 0))
    add("medium", "pier-span", "Pier span", "pierSpan(heights: number[]): number",
        "Topic: two pointers. Choose two piers. The span is the shorter height times the index distance. Return the largest span.",
        "pierSpan([1, 8, 6, 2, 5, 4, 8, 3, 7])", container([1, 8, 6, 2, 5, 4, 8, 3, 7]))
    add("easy", "park-zeros", "Park the zeros", "parkZeros(lanes: number[]): number[]",
        "Topic: arrays. Move every 0 to the end and keep the relative order of the other numbers.",
        "parkZeros([0, 1, 0, 3, 12])", move_zero([0, 1, 0, 3, 12]))
    add("easy", "badge-plus", "Badge plus one", "badgePlus(digits: number[]): number[]",
        "Topic: arrays. digits is a non-negative integer, most significant digit first. Return the digits of that number plus one.",
        "badgePlus([9, 9])", plus_one([9, 9]))
    add("easy", "rotate-line", "Rotate the line", "rotateLine(values: number[], steps: number): number[]",
        "Topic: arrays. Rotate right by steps places. steps may exceed the length.",
        "rotateLine([1, 2, 3, 4, 5], 2)", rotate([1, 2, 3, 4, 5], 2))
    add("easy", "sorted-squares", "Sorted squares", "sortedSquares(values: number[]): number[]",
        "Topic: two pointers. values is sorted and may be negative. Return the squares in ascending order.",
        "sortedSquares([-4, -1, 0, 3, 10])", squares([-4, -1, 0, 3, 10]))
    add("easy", "merge-queues", "Merge two queues", "mergeQueues(a: number[], b: number[]): number[]",
        "Topic: two pointers. Both inputs are sorted ascending. Return one sorted list. Keep duplicates.",
        "mergeQueues([1, 4, 6], [2, 3, 6])", merge([1, 4, 6], [2, 3, 6]))
    add("easy", "unique-sorted-len", "Unique sorted length", "uniqueSortedLength(values: number[]): number",
        "Topic: two pointers. values is sorted. Return how many values remain if adjacent duplicates collapse to one.",
        "uniqueSortedLength([0, 0, 1, 1, 2, 3, 3])", dedupe([0, 0, 1, 1, 2, 3, 3]))
    add("easy", "repeat-badge", "Repeated badge", "hasRepeat(ids: number[]): boolean",
        "Topic: hashing. Return whether any id appears more than once.",
        "hasRepeat([3, 1, 4, 1])", has_dup([3, 1, 4, 1]))
    add("easy", "nearby-repeat", "Nearby repeat", "nearbyRepeat(ids: number[], limit: number): boolean",
        "Topic: hashing. Return whether some id repeats at two indexes at most limit apart.",
        "nearbyRepeat([1, 2, 3, 1], 3)", nearby([1, 2, 3, 1], 3))
    add("medium", "nearby-almost", "Nearby almost duplicate", "nearbyAlmost(values: number[], indexLimit: number, valueLimit: number): boolean",
        "Topic: hashing. Return whether two indexes are at most indexLimit apart and their values differ by at most valueLimit.",
        "nearbyAlmost([1, 5, 9, 1, 5, 9], 2, 3)", nearby_almost([1, 5, 9, 1, 5, 9], 2, 3))
    add("easy", "flip-words", "Flip the words", "flipWords(sentence: string): string",
        "Topic: strings. Reverse the word order. Collapse whitespace to single spaces and drop the ends.",
        "flipWords('  docks open  late ')", flip_words("  docks open  late "))
    add("easy", "loose-palindrome", "Loose palindrome", "loosePalindrome(text: string): boolean",
        "Topic: two pointers. Ignore case and non-alphanumeric characters. Return whether the rest is a palindrome.",
        "loosePalindrome('A man, a plan, a canal: Panama')", loose_pal("A man, a plan, a canal: Panama"))
    add("easy", "almost-palindrome", "Almost a palindrome", "almostPalindrome(text: string): boolean",
        "Topic: two pointers. Return whether deleting at most one character makes text a palindrome. Every character counts.",
        "almostPalindrome('abca')", almost_pal("abca"))
    add("easy", "bracket-check", "Bracket check", "bracketsOk(text: string): boolean",
        "Topic: stack. text uses only ()[]{}. Return whether the brackets match and nest.",
        "bracketsOk('([{}])')", brackets("([{}])"))
    add("easy", "roman-value", "Roman value", "romanValue(text: string): number",
        "Topic: strings. text is a Roman numeral using I, V, X, L, C, D, and M. Return the integer.",
        "romanValue('MCMXCIV')", roman("MCMXCIV"))
    add("medium", "write-roman", "Write a Roman numeral", "writeRoman(value: number): string",
        "Topic: greedy. value is from 1 to 3999. Return the standard Roman form, including pairs such as IV and CM.",
        "writeRoman(1994)", write_roman(1994))
    add("easy", "column-title", "Column title", "columnTitle(index: number): string",
        "Topic: math. Columns run A, B, ..., Z, AA. index starts at 1. Return the title.",
        "columnTitle(28)", col_title(28))
    add("easy", "column-index", "Column index", "columnIndex(title: string): number",
        "Topic: math. Return the 1-based index of a spreadsheet column title.",
        "columnIndex('ZY')", col_index("ZY"))
    add("easy", "happy-id", "Happy id", "isHappyId(value: number): boolean",
        "Topic: hashing. Replace a positive integer by the sum of the squares of its digits until it repeats. Return whether it reaches 1.",
        "isHappyId(19)", happy(19))
    add("easy", "trailing-zeros", "Trailing zeros", "trailingZeros(n: number): number",
        "Topic: math. Return the number of trailing zeros in n factorial without computing the factorial.",
        "trailingZeros(25)", trailing(25))
    add("easy", "whole-root", "Whole square root", "wholeRoot(n: number): number",
        "Topic: binary search. Return the greatest integer whose square is at most n.",
        "wholeRoot(15)", isqrt(15))
    add("easy", "binary-add", "Binary add", "binaryAdd(a: string, b: string): string",
        "Topic: math. a and b are binary strings. Return their sum as a binary string.",
        "binaryAdd('1010', '1011')", add_bin("1010", "1011"))
    add("easy", "set-bits", "Set bits", "setBits(n: number): number",
        "Topic: bits. Return how many bits of the non-negative integer n are 1.",
        "setBits(11)", bits(11))
    add("easy", "bit-distance", "Bit distance", "bitDistance(a: number, b: number): number",
        "Topic: bits. Return how many bit positions differ between the non-negative integers a and b.",
        "bitDistance(1, 4)", bits(1 ^ 4))
    add("easy", "power-of-two", "Power of two", "isPowerOfTwo(n: number): boolean",
        "Topic: bits. Return whether n is a positive power of two.",
        "isPowerOfTwo(16)", 16 > 0 and 16 & 15 == 0)
    add("easy", "stair-count", "Stair count", "stairCount(n: number): number",
        "Topic: dynamic programming. Climb n stairs taking 1 or 2 at a time. Order matters. Return the number of ways. n is at least 1.",
        "stairCount(5)", climb(5))
    add("easy", "toll-stairs", "Toll stairs", "tollStairs(cost: number[]): number",
        "Topic: dynamic programming. cost[i] is paid when you step on stair i. You may start at 0 or 1 and then move one or two stairs. Return the cheapest cost to pass the top.",
        "tollStairs([10, 15, 20])", toll([10, 15, 20]))
    add("medium", "night-route", "Night route", "nightRoute(loot: number[]): number",
        "Topic: dynamic programming. You cannot take two adjacent houses. Return the best sum.",
        "nightRoute([2, 7, 9, 3, 1])", rob([2, 7, 9, 3, 1]))
    add("medium", "ring-route", "Ring route", "ringRoute(loot: number[]): number",
        "Topic: dynamic programming. Houses form a circle, so the first and last are adjacent. Return the best sum with no two chosen houses adjacent.",
        "ringRoute([2, 3, 2])", rob_circ([2, 3, 2]))
    add("medium", "earn-or-delete", "Earn or delete", "earnOrDelete(values: number[]): number",
        "Topic: dynamic programming. Taking a value earns it and deletes every copy of the neighboring integers. Return the maximum earnings.",
        "earnOrDelete([3, 4, 2])", delete_earn([3, 4, 2]))
    add("medium", "fewest-stamps", "Fewest stamps", "fewestStamps(stamps: number[], postage: number): number",
        "Topic: dynamic programming. Stamps may be reused. Return the fewest that sum to postage, or -1. Zero postage needs zero stamps.",
        "fewestStamps([1, 3, 4], 6)", coin([1, 3, 4], 6))
    add("medium", "stamp-orders", "Stamp combinations", "stampOrders(stamps: number[], postage: number): number",
        "Topic: dynamic programming. Count combinations, not permutations, of reusable stamps that sum to postage. Zero postage has one empty combination.",
        "stampOrders([1, 2, 5], 5)", coin_ways([1, 2, 5], 5))
    add("medium", "square-stamps", "Square stamps", "squareStamps(n: number): number",
        "Topic: dynamic programming. Each stamp covers a positive perfect square. Return the fewest stamps that cover exactly n.",
        "squareStamps(12)", squares_n(12))
    add("medium", "break-integer", "Break an integer", "breakInteger(n: number): number",
        "Topic: dynamic programming. Split n into at least two positive integers and return the maximum product of the parts.",
        "breakInteger(10)", integer_break(10))
    add("medium", "search-tree-count", "Search tree count", "searchTreeCount(n: number): number",
        "Topic: dynamic programming, trees. Count binary search tree shapes on keys 1 through n.",
        "searchTreeCount(3)", unique_bst(3))
    add("medium", "rising-chain", "Rising chain", "risingChain(values: number[]): number",
        "Topic: dynamic programming. Return the length of the longest strictly increasing subsequence. It need not be contiguous.",
        "risingChain([10, 9, 2, 5, 3, 7, 101, 18])", lis([10, 9, 2, 5, 3, 7, 101, 18]))
    add("medium", "shared-letters", "Shared letter run", "sharedRun(a: string, b: string): number",
        "Topic: dynamic programming. Return the length of the longest common subsequence. Order is kept; letters need not be contiguous.",
        "sharedRun('abcde', 'ace')", lcs("abcde", "ace"))
    add("medium", "shared-slice", "Shared slice", "sharedSlice(a: string, b: string): number",
        "Topic: dynamic programming. Return the length of the longest shared contiguous substring.",
        "sharedSlice('bluefish', 'goldfish')", lcsub("bluefish", "goldfish"))
    add("medium", "edit-steps", "Edit steps", "editSteps(a: string, b: string): number",
        "Topic: dynamic programming. Return the fewest insertions, deletions, and substitutions that turn a into b.",
        "editSteps('kitten', 'sitting')", edit("kitten", "sitting"))
    add("easy", "balance-index", "Balance index", "balanceIndex(values: number[]): number",
        "Topic: prefix sums. Return the smallest index whose strict left sum equals its strict right sum, or -1. An empty side sums to 0.",
        "balanceIndex([1, 7, 3, 6, 5, 6])", pivot([1, 7, 3, 6, 5, 6]))
    add("easy", "majority-id", "Majority id", "majorityId(ids: number[]): number",
        "Topic: voting. One id occurs more than half the time. Return it.",
        "majorityId([2, 2, 1, 1, 1, 2, 2])", majority([2, 2, 1, 1, 1, 2, 2]))
    add("medium", "council-ids", "Council ids", "councilIds(ids: number[]): number[]",
        "Topic: voting. Return every id that occurs more than length/3 times, sorted ascending.",
        "councilIds([3, 2, 3])", majority2([3, 2, 3]))
    add("easy", "missing-gate", "Missing gate", "missingGate(ids: number[]): number",
        "Topic: bits. ids contains every integer from 0 through n except one, where n is the length. Return the missing integer.",
        "missingGate([3, 0, 1])", missing([3, 0, 1]))
    add("hard", "first-open-slot", "First open slot", "firstOpenSlot(ids: number[]): number",
        "Topic: arrays. Values may be negative or larger than the length. Return the smallest missing positive integer.",
        "firstOpenSlot([3, 4, -1, 1])", first_missing([3, 4, -1, 1]))
    add("easy", "lone-badge", "Lone badge", "loneBadge(ids: number[]): number",
        "Topic: bits. Every id appears twice except one. Return the one that appears once.",
        "loneBadge([4, 1, 2, 1, 2])", single([4, 1, 2, 1, 2]))
    add("medium", "lone-triple", "Lone among triples", "loneAmongTriples(ids: number[]): number",
        "Topic: bits. Every id appears three times except one, which appears once. Return that id.",
        "loneAmongTriples([0, 1, 0, 1, 0, 1, 99])", single3([0, 1, 0, 1, 0, 1, 99]))
    add("easy", "common-prefix", "Common prefix", "commonPrefix(labels: string[]): string",
        "Topic: strings. Return the longest shared prefix, or an empty string.",
        "commonPrefix(['flower', 'flow', 'flight'])", prefix(["flower", "flow", "flight"]))
