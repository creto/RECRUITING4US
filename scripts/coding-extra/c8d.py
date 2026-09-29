
def register(add):
    def wiggle(a):
        up=down=1
        for i in range(1,len(a)):
            if a[i]>a[i-1]: up=down+1
            elif a[i]<a[i-1]: down=up+1
        return max(up,down)
    def triplet(a):
        first=second=10**18
        for x in a:
            if x<=first: first=x
            elif x<=second: second=x
            else: return True
        return False
    def mountain(a):
        n=len(a); best=0; i=1
        while i<n-1:
            if a[i]>a[i-1] and a[i]>a[i+1]:
                l=r=i
                while l and a[l]>a[l-1]: l-=1
                while r+1<n and a[r]>a[r+1]: r+=1
                best=max(best, r-l+1); i=r
            i+=1
        return best
    def ones(a,k):
        i=z=best=0
        for j,x in enumerate(a):
            z+=x==0
            while z>k:
                z-=a[i]==0; i+=1
            best=max(best, j-i+1)
        return best
    def flowers(bed,n):
        b=[0]+bed+[0]
        for i in range(1,len(b)-1):
            if b[i-1]==b[i]==b[i+1]==0:
                b[i]=1; n-=1
        return n<=0
    def nondec(a):
        a=a[:]; used=False
        for i in range(1,len(a)):
            if a[i]<a[i-1]:
                if used: return False
                used=True
                if i>1 and a[i]<a[i-2]: a[i]=a[i-1]
        return True
    def third(a):
        vals=[]
        for x in a:
            if x in vals: continue
            vals.append(x); vals.sort(reverse=True)
            vals=vals[:3]
        return vals[2] if len(vals)==3 else vals[0]
    def poison(ts,d):
        total=0
        for a,b in zip(ts, ts[1:]): total+=min(d,b-a)
        return total+d
    def degree(a):
        from collections import Counter
        c=Counter(a); deg=max(c.values()); first={}; last={}
        for i,x in enumerate(a):
            first.setdefault(x,i); last[x]=i
        return min(last[x]-first[x]+1 for x,n in c.items() if n==deg)
    def divs(a,k):
        from collections import Counter
        seen=Counter({0:1}); run=count=0
        for x in a:
            run=(run+x)%k; count+=seen[run]; seen[run]+=1
        return count
    def cont(a,k):
        seen={0:-1}; run=0
        for i,x in enumerate(a):
            run+=x; mod=run%k
            if mod in seen and i-seen[mod]>=2: return True
            seen.setdefault(mod,i)
        return False
    def reorg(s):
        from collections import Counter
        import heapq
        c=Counter(s)
        if max(c.values())>(len(s)+1)//2: return ""
        heap=[(-n,ch) for ch,n in c.items()]; heapq.heapify(heap)
        prev=None; out=[]
        while heap or prev:
            if prev and not heap: return ""
            n,ch=heapq.heappop(heap); out.append(ch)
            if prev: heapq.heappush(heap, prev)
            prev=(n+1,ch) if n+1 else None
        return "".join(out)
    def freq(s):
        from collections import Counter
        return "".join(ch*n for ch,n in sorted(Counter(s).items(), key=lambda kv:(-kv[1], kv[0])))
    def custom(order,s):
        rank={c:i for i,c in enumerate(order)}
        return "".join(sorted(s, key=lambda c: rank.get(c, 100)))
    def alien(words, order):
        rank={c:i for i,c in enumerate(order)}
        return words==sorted(words, key=lambda w:[rank[c] for c in w])
    def diff(s,t):
        x=0
        for c in s+t: x^=ord(c)
        return chr(x)
    def palbuild(s):
        from collections import Counter
        odd=total=0
        for n in Counter(s).values():
            total+=n//2*2; odd|=n%2
        return total+odd
    def subseq(s,t):
        i=0
        for c in t:
            if i<len(s) and s[i]==c: i+=1
        return i==len(s)
    def groups(s):
        ans=prev=i=0
        while i<len(s):
            j=i
            while j<len(s) and s[j]==s[i]: j+=1
            ans+=min(prev, j-i); prev=j-i; i=j
        return ans
    def repeated(s):
        return s in (s+s)[1:-1]
    def rot(s,g):
        return len(s)==len(g) and g in s+s
    def mails(emails):
        out=set()
        for e in emails:
            local,dom=e.split("@")
            local=local.split("+")[0].replace(".","")
            out.add(local+"@"+dom)
        return len(out)
    def common(paragraph, banned):
        import re
        from collections import Counter
        words=re.findall(r"[a-z]+", paragraph.lower())
        ban=set(banned)
        return Counter(w for w in words if w not in ban).most_common(1)[0][0]
    def near(s,c):
        n=len(s); ans=[n]*n; last=-n
        for i,ch in enumerate(s):
            if ch==c: last=i
            ans[i]=abs(i-last) if False else i-last
        last=2*n
        for i in range(n-1,-1,-1):
            if s[i]==c: last=i
            ans[i]=min(ans[i], last-i)
        return ans
    def rows(words):
        rows=[set("qwertyuiop"), set("asdfghjkl"), set("zxcvbnm")]
        return [w for w in words if any(set(w.lower())<=row for row in rows)]
    def caps(word):
        return word.isupper() or word.islower() or word[0].isupper() and word[1:].islower()
    def flip(s):
        return " ".join(w[::-1] for w in s.split(" "))
    def revint(n):
        sign=1 if n>=0 else -1
        v=int(str(abs(n))[::-1])*sign
        return 0 if v>2147483647 or v<-2147483648 else v
    def atoi(s):
        s=s.lstrip(); sign=1; i=0
        if i<len(s) and s[i] in "+-":
            sign=-1 if s[i]=="-" else 1; i+=1
        num=0
        while i<len(s) and s[i].isdigit():
            num=num*10+int(s[i]); i+=1
        return max(-2147483648, min(2147483647, num*sign))
    def bulb(n):
        return int(n**0.5)
    def pigs(buckets, die, test):
        import math
        if buckets<=1: return 0
        states=test//die+1
        return math.ceil(math.log(buckets)/math.log(states))
    def champ(poured, row, glass):
        cur=[poured]
        for r in range(1,row+1):
            nxt=[0]*(r+1)
            for i,v in enumerate(cur):
                extra=v-1
                if extra>0:
                    nxt[i]+=extra/2; nxt[i+1]+=extra/2
            cur=nxt
        return min(1.0, cur[glass])
    def elim(n):
        rem=n; left=True; head=1; step=1
        while rem>1:
            if left or rem%2==1: head+=step
            rem//=2; step*=2; left=not left
        return head
    def irepl(n):
        steps=0
        while n>1:
            if n%2==0: n//=2
            elif n==3 or n%4==1: n-=1
            else: n+=1
            steps+=1
        return steps
    def sumbits(a,b):
        mask=0xFFFFFFFF
        while b&mask:
            a,b=(a^b)&mask, ((a&b)<<1)&mask
        return a if a<0x80000000 else a-2**32
    def utf(data):
        need=0
        for n in data:
            if need:
                if (n>>6)!=0b10: return False
                need-=1
            elif n>>7==0: need=0
            elif n>>5==0b110: need=1
            elif n>>4==0b1110: need=2
            elif n>>3==0b11110: need=3
            else: return False
        return need==0
    def additive(num):
        n=len(num)
        def ok(i,a,b):
            if i==n: return True
            s=str(a+b)
            return num.startswith(s,i) and ok(i+len(s), b, a+b)
        for i in range(1,n):
            for j in range(1,n-i):
                a,b=num[:i], num[i:i+j]
                if (len(a)>1 and a[0]=="0") or (len(b)>1 and b[0]=="0"): continue
                if ok(i+j, int(a), int(b)): return True
        return False
    def hand(cards, group):
        from collections import Counter
        if len(cards)%group: return False
        c=Counter(cards)
        for start in sorted(c):
            while c[start]:
                for x in range(start, start+group):
                    if not c[x]: return False
                    c[x]-=1
        return True
    def moves(a):
        low=min(a); return sum(x-low for x in a)
    def domino(tops, bottoms):
        def flips(target):
            f=0
            for a,b in zip(tops, bottoms):
                if a==target: continue
                if b!=target: return 10**9
                f+=1
            return f
        ans=min(flips(tops[0]), flips(bottoms[0]))
        return -1 if ans>=10**9 else ans
    def unsorted(nums):
        n=len(nums); left,right=n,0; cur=nums[0]
        for i in range(n):
            if nums[i]<cur: right=i
            cur=max(cur, nums[i])
        cur=nums[-1]
        for i in range(n-1,-1,-1):
            if nums[i]>cur: left=i
            cur=min(cur, nums[i])
        return 0 if right<=left else right-left+1
    def range_count(nums, lower, upper):
        arr=nums[:]
        def sort(lo,hi):
            if hi-lo<=1: return 0
            mid=(lo+hi)//2
            count=sort(lo,mid)+sort(mid,hi)
            j=k=mid
            for left in arr[lo:mid]:
                while k<hi and arr[k]-left<lower: k+=1
                while j<hi and arr[j]-left<=upper: j+=1
                count+=j-k
            arr[lo:hi]=sorted(arr[lo:hi])
            return count
        return sort(0,len(arr))
    def rev_pairs(nums):
        arr=nums[:]
        def sort(lo,hi):
            if hi-lo<=1: return 0
            mid=(lo+hi)//2
            count=sort(lo,mid)+sort(mid,hi)
            j=mid
            for i in range(lo,mid):
                while j<hi and arr[i]>2*arr[j]: j+=1
                count+=j-mid
            arr[lo:hi]=sorted(arr[lo:hi])
            return count
        return sort(0,len(arr))
    def smaller(nums):
        items=list(enumerate(nums)); res=[0]*len(nums)
        def sort(xs):
            if len(xs)<=1: return xs
            mid=len(xs)//2
            L,R=sort(xs[:mid]), sort(xs[mid:])
            merged=[]; i=j=0
            while i<len(L) and j<len(R):
                if L[i][1]<=R[j][1]:
                    res[L[i][0]]+=j; merged.append(L[i]); i+=1
                else:
                    merged.append(R[j]); j+=1
            while i<len(L):
                res[L[i][0]]+=j; merged.append(L[i]); i+=1
            return merged+R[j:]
        sort(items); return res
    def kth_large(a,k):
        return sorted(a, reverse=True)[k-1]
    def topk(a,k):
        from collections import Counter
        return sorted(n for n,_ in Counter(a).most_common(k))
    add("medium","bay2-wiggle","Alternating length","alternatingLength(values: number[]): number","Topic: greedy. Return the longest subsequence that strictly rises and falls in turn.","alternatingLength([1, 7, 4, 9, 2, 5])", wiggle([1,7,4,9,2,5]))
    add("medium","bay2-triplet","Three rising indexes","hasThreeRising(values: number[]): boolean","Topic: greedy. Return whether three increasing indexes hold strictly increasing values.","hasThreeRising([1, 2, 3, 4, 5])", triplet([1,2,3,4,5]))
    add("medium","bay2-mountain","Peak mountain length","peakMountainLength(values: number[]): number","Topic: arrays. A mountain rises strictly then falls strictly and has length at least 3. Return the longest, or 0.","peakMountainLength([2, 1, 4, 7, 3, 2, 5])", mountain([2,1,4,7,3,2,5]))
    add("medium","bay2-ones","Longest ones after flips","longestOnesAfterFlips(values: number[], budget: number): number","Topic: sliding window. Flip at most budget zeros. Return the longest run of ones.","longestOnesAfterFlips([1,1,1,0,0,0,1,1,1,1,0], 2)", ones([1,1,1,0,0,0,1,1,1,1,0],2))
    add("easy","bay2-flowers","Flower gaps","flowersFit(bed: number[], needed: number): boolean","Topic: greedy. Empty plots need empty neighbors. Return whether needed new flowers fit.","flowersFit([1,0,0,0,1], 1)", flowers([1,0,0,0,1],1))
    add("easy","bay2-nondec","One change keeps order","oneChangeKeepsOrder(values: number[]): boolean","Topic: arrays. Change at most one value. Return whether the list can be nondecreasing.","oneChangeKeepsOrder([4, 2, 3])", nondec([4,2,3]))
    add("easy","bay2-third","Third distinct max","thirdDistinctMax(values: number[]): number","Topic: sorting. Return the third largest distinct value, or the largest if fewer than three exist.","thirdDistinctMax([3, 2, 1])", third([3,2,1]))
    add("easy","bay2-poison","Active poison seconds","activePoisonSeconds(times: number[], duration: number): number","Topic: arrays. A sting lasts duration seconds and resets. Return the covered seconds.","activePoisonSeconds([1, 4], 2)", poison([1,4],2))
    add("easy","bay2-degree","Shortest high-frequency slice","shortestHighFrequencySlice(values: number[]): number","Topic: hashing. Return the shortest slice whose most frequent value matches the array degree.","shortestHighFrequencySlice([1, 2, 2, 3, 1])", degree([1,2,2,3,1]))
    add("medium","bay2-divisible","Slices divisible by K","slicesDivisibleBy(values: number[], k: number): number","Topic: prefix sums. Count slices whose sum is divisible by k.","slicesDivisibleBy([4, 5, 0, -2, -3, 1], 5)", divs([4,5,0,-2,-3,1],5))
    add("medium","bay2-multiple","Long multiple slice","hasLongMultipleSlice(values: number[], k: number): boolean","Topic: prefix sums. Return whether some slice of length at least 2 has a sum divisible by k.","hasLongMultipleSlice([23, 2, 4, 6, 7], 6)", cont([23,2,4,6,7],6))
    add("medium","bay2-reorg","No adjacent repeat","noAdjacentRepeat(text: string): string","Topic: heaps. Rearrange so equal letters are not adjacent. Return any answer, or empty if impossible.","noAdjacentRepeat('aab')", reorg("aab"))
    add("easy","bay2-freq","Sort by frequency","sortByFrequency(text: string): string","Topic: sorting. Sort characters by descending count, then by character.","sortByFrequency('tree')", freq("tree"))
    add("medium","bay2-custom","Order from a key","orderFromKey(order: string, text: string): string","Topic: sorting. Letters in order come first in that order. Other letters stay stable after them.","orderFromKey('cba', 'abcd')", custom("cba","abcd"))
    add("easy","bay2-alien","Sorted in a new alphabet","sortedInAlphabet(words: string[], order: string): boolean","Topic: sorting. order is a full lowercase alphabet. Return whether words are already sorted.","sortedInAlphabet(['hello', 'recruit'], 'hlabcdefgijkmnopqrstuvwxyz')", alien(["hello","recruit"], "hlabcdefgijkmnopqrstuvwxyz"))
    add("easy","bay2-extra","Added character","addedCharacter(shorter: string, longer: string): string","Topic: bits. longer is shorter shuffled with one extra character. Return it.","addedCharacter('abcd', 'abcde')", diff("abcd","abcde"))
    add("easy","bay2-pal-len","Build a palindrome","buildPalindromeLength(letters: string): number","Topic: counting. Return the longest palindrome length you can build. Leftover letters may be dropped, except one center.","buildPalindromeLength('abccccdd')", palbuild("abccccdd"))
    add("easy","bay2-subseq","Subsequence check","isOrderedSubsequence(needle: string, text: string): boolean","Topic: two pointers. Return whether needle can be formed by deleting characters from text.","isOrderedSubsequence('abc', 'ahbgdc')", subseq("abc","ahbgdc"))
    add("easy","bay2-groups","Equal binary runs","equalBinaryRuns(text: string): number","Topic: strings. Count substrings made of one run of 0s and one run of 1s of equal length.","equalBinaryRuns('00110011')", groups("00110011"))
    add("easy","bay2-repeat","Repeated block","isRepeatedBlock(text: string): boolean","Topic: strings. Return whether text repeats a shorter block at least twice.","isRepeatedBlock('abab')", repeated("abab"))
    add("easy","bay2-rotation","Is a rotation","isARotation(text: string, goal: string): boolean","Topic: strings. Return whether goal is text rotated.","isARotation('abcde', 'cdeab')", rot("abcde","cdeab"))
    add("medium","bay2-mail","Distinct normalized mail","distinctNormalizedMail(addresses: string[]): number","Topic: strings. Ignore dots and a plus suffix in the local part. Return how many addresses remain.","distinctNormalizedMail(['a.b+c@x.com', 'ab@x.com'])", mails(["a.b+c@x.com","ab@x.com"]))
    add("easy","bay2-common","Most used word","mostUsedWord(paragraph: string, banned: string[]): string","Topic: hashing. Ignore case and banned words. Return the unique most common word.","mostUsedWord('Bob hit a ball, the hit BALL flew far after it was hit.', ['hit'])", common("Bob hit a ball, the hit BALL flew far after it was hit.", ["hit"]))
    add("easy","bay2-nearest","Distance to a mark","distanceToMark(text: string, mark: string): number[]","Topic: arrays. mark is one character that occurs. Return the distance from each index to the nearest mark.","distanceToMark('bookkeeper', 'e')", near("bookkeeper","e"))
    add("easy","bay2-row","Single keyboard row","singleKeyboardRow(words: string[]): string[]","Topic: sets. Keep words typed on one QWERTY row. Ignore case and keep order.","singleKeyboardRow(['Hello', 'Alaska', 'Dad', 'Peace'])", rows(["Hello","Alaska","Dad","Peace"]))
    add("easy","bay2-caps","Capital pattern","capitalPatternOk(word: string): boolean","Topic: strings. Accept all caps, all lowercase, or a single leading capital.","capitalPatternOk('Recruit')", caps("Recruit"))
    add("easy","bay2-flip","Reverse each token","reverseEachToken(text: string): string","Topic: strings. Reverse every token. Preserve the spaces, including repeated spaces.","reverseEachToken('Let us go')", flip("Let us go"))
    add("easy","bay2-decimal","Add decimal strings","addDecimalStrings(left: string, right: string): string","Topic: math. Add two non-negative decimal strings.","addDecimalStrings('11', '123')", str(11+123))
    add("medium","bay2-revint","Reverse digits with a cap","reverseDigitsCapped(value: number): number","Topic: math. Reverse digits and keep the sign. Return 0 when the result leaves the 32-bit signed range.","reverseDigitsCapped(123)", revint(123))
    add("medium","bay2-atoi","Read a clamped integer","readClampedInteger(text: string): number","Topic: strings. Skip spaces, read a sign and digits, and clamp to 32-bit signed range.","readClampedInteger('   -42')", atoi("   -42"))
    add("medium","bay2-bulbs","Bulbs still on","bulbsStillOn(n: number): number","Topic: math. n bulbs start off. Pass i toggles every ith bulb. Return how many are on.","bulbsStillOn(3)", bulb(3))
    add("hard","bay2-pigs","Fewest testers","fewestTesters(buckets: number, dieMinutes: number, minutes: number): number","Topic: math. One bucket is bad. A tester dies dieMinutes after tasting it. You have minutes. Return the fewest testers.","fewestTesters(1000, 15, 60)", pigs(1000,15,60))
    add("medium","bay2-glass","Glass fill","glassFill(poured: number, row: number, glass: number): number","Topic: simulation. Pour into the top glass. Overflow splits in half to the two glasses below. Return the fill of the queried glass, at most 1.","glassFill(1, 1, 1)", round(champ(1,1,1),5))
    add("medium","bay2-elim","Last person standing","lastPersonStanding(n: number): number","Topic: math. Count out every second person, starting at 1. Return the survivor.","lastPersonStanding(9)", elim(9))
    add("hard","bay2-replace","Steps down to one","stepsDownToOne(n: number): number","Topic: greedy. Halve evens. Add or subtract 1 from odds. Return the fewest steps to 1.","stepsDownToOne(8)", irepl(8))
    add("medium","bay2-sumbits","Add with bits only","addWithBits(left: number, right: number): number","Topic: bits. Return the sum using bitwise operations. Inputs and the sum fit in 32-bit signed integers.","addWithBits(1, 2)", sumbits(1,2))
    add("medium","bay2-utf","Valid byte sequence","validByteSequence(data: number[]): boolean","Topic: bits. Each value is a byte. Return whether it is valid UTF-8.","validByteSequence([197, 130, 1])", utf([197,130,1]))
    add("medium","bay2-additive","Additive split","hasAdditiveSplit(digits: string): boolean","Topic: backtracking. Split into at least three numbers, no leading zeros, each the sum of the previous two.","hasAdditiveSplit('112358')", additive("112358"))
    add("medium","bay2-hand","Consecutive groups","canMakeConsecutiveGroups(cards: number[], size: number): boolean","Topic: greedy. Group every card into consecutive runs of the given size.","canMakeConsecutiveGroups([1,2,3,6,2,3,4,7,8], 3)", hand([1,2,3,6,2,3,4,7,8],3))
    add("easy","bay2-moves","Increments to equal","incrementsToEqual(values: number[]): number","Topic: math. A move increments every value but one. Return the fewest moves that equalize the list.","incrementsToEqual([1, 2, 3])", moves([1,2,3]))
    add("medium","bay2-domino","Domino face flips","dominoFaceFlips(tops: number[], bottoms: number[]): number","Topic: greedy. Flip dominoes so one face is the same across the top or the bottom. Return the fewest flips, or -1.","dominoFaceFlips([2,1,2,4,2,2], [5,2,6,2,3,2])", domino([2,1,2,4,2,2],[5,2,6,2,3,2]))
    add("medium","bay2-unsorted","Span to sort","spanToSort(values: number[]): number","Topic: arrays. Return the shortest slice you must sort to make the list nondecreasing, or 0.","spanToSort([2, 6, 4, 8, 10, 9, 15])", unsorted([2,6,4,8,10,9,15]))
    add("hard","bay2-range","Slice sums in a band","sliceSumsInBand(values: number[], low: number, high: number): number","Topic: divide and conquer. Count slices whose sum lies between low and high.","sliceSumsInBand([-2, 5, -1], -2, 2)", range_count([-2,5,-1],-2,2))
    add("hard","bay2-rpairs","Doubled reverse pairs","doubledReversePairs(values: number[]): number","Topic: divide and conquer. Count i < j with values[i] > 2 * values[j].","doubledReversePairs([1, 3, 2, 3, 1])", rev_pairs([1,3,2,3,1]))
    add("hard","bay2-smaller","Later smaller counts","laterSmallerCounts(values: number[]): number[]","Topic: divide and conquer. For each index return how many later values are strictly smaller.","laterSmallerCounts([5, 2, 6, 1])", smaller([5,2,6,1]))
    add("medium","bay2-kth","Kth by size","kthBySize(values: number[], k: number): number","Topic: sorting. Return the kth largest, with duplicates counted apart.","kthBySize([3, 2, 1, 5, 6, 4], 2)", kth_large([3,2,1,5,6,4],2))
    add("medium","bay2-topk","Ids seen most","idsSeenMost(values: number[], k: number): number[]","Topic: hashing. Return the k most frequent ids, sorted ascending.","idsSeenMost([1, 1, 1, 2, 2, 3], 2)", topk([1,1,1,2,2,3],2))
