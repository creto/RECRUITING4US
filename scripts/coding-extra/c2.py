
def register(add):
    def subarray_sum(a, k):
        seen = {0: 1}; s = n = 0
        for x in a:
            s += x
            n += seen.get(s - k, 0)
            seen[s] = seen.get(s, 0) + 1
        return n
    def sub_div(a, k):
        seen = {0: 1}; s = n = 0
        for x in a:
            s = (s + x) % k
            n += seen.get(s, 0)
            seen[s] = seen.get(s, 0) + 1
        return n
    def min_len(target, a):
        i = s = 0; best = 10**9
        for j, x in enumerate(a):
            s += x
            while s >= target:
                best = min(best, j - i + 1)
                s -= a[i]; i += 1
        return 0 if best == 10**9 else best
    def prod_under(a, k):
        if k <= 1: return 0
        i = 0; prod = 1; n = 0
        for j, x in enumerate(a):
            prod *= x
            while prod >= k:
                prod //= a[i]; i += 1
            n += j - i + 1
        return n
    def at_most_k(s, k):
        from collections import Counter
        m = Counter(); i = best = 0
        for j, c in enumerate(s):
            m[c] += 1
            while len(m) > k:
                m[s[i]] -= 1
                if m[s[i]] == 0: del m[s[i]]
                i += 1
            best = max(best, j - i + 1)
        return best
    def replace_repeat(s, k):
        from collections import Counter
        m = Counter(); i = best = maxf = 0
        for j, c in enumerate(s):
            m[c] += 1
            maxf = max(maxf, m[c])
            while j - i + 1 - maxf > k:
                m[s[i]] -= 1; i += 1
            best = max(best, j - i + 1)
        return best
    def inclusion(p, s):
        if len(p) > len(s): return False
        need = [0]*26; have = [0]*26
        for c in p: need[ord(c)-97] += 1
        for i, c in enumerate(s):
            have[ord(c)-97] += 1
            if i >= len(p): have[ord(s[i-len(p)])-97] -= 1
            if i >= len(p)-1 and need == have: return True
        return False
    def anagram_starts(p, s):
        out = []
        if len(p) > len(s): return out
        need = [0]*26; have = [0]*26
        for c in p: need[ord(c)-97] += 1
        for i, c in enumerate(s):
            have[ord(c)-97] += 1
            if i >= len(p): have[ord(s[i-len(p)])-97] -= 1
            if i >= len(p)-1 and need == have: out.append(i-len(p)+1)
        return out
    def ones_flip(a, k):
        i = zeros = best = 0
        for j, x in enumerate(a):
            zeros += x == 0
            while zeros > k:
                zeros -= a[i] == 0; i += 1
            best = max(best, j - i + 1)
        return best
    def at_most_sum(a, limit):
        if limit < 0: return 0
        i = s = n = 0
        for j, x in enumerate(a):
            s += x
            while s > limit:
                s -= a[i]; i += 1
            n += j - i + 1
        return n
    def fruit(a):
        from collections import Counter
        m = Counter(); i = best = 0
        for j, x in enumerate(a):
            m[x] += 1
            while len(m) > 2:
                m[a[i]] -= 1
                if m[a[i]] == 0: del m[a[i]]
                i += 1
            best = max(best, j - i + 1)
        return best
    def insert_iv(intervals, nxt):
        out = []; s, e = nxt; placed = False
        for a, b in intervals:
            if b < s: out.append([a, b])
            elif a > e:
                if not placed:
                    out.append([s, e]); placed = True
                out.append([a, b])
            else:
                s, e = min(s, a), max(e, b)
        if not placed: out.append([s, e])
        return out
    def erase(intervals):
        a = sorted(intervals, key=lambda x: x[1])
        end = -10**9; keep = 0
        for s, e in a:
            if s >= end:
                keep += 1; end = e
        return len(a) - keep
    def attend(intervals):
        a = sorted(intervals)
        return all(a[i][0] >= a[i-1][1] for i in range(1, len(a)))
    def shared(a, b):
        i = j = 0; out = []
        while i < len(a) and j < len(b):
            s, e = max(a[i][0], b[j][0]), min(a[i][1], b[j][1])
            if s <= e: out.append([s, e])
            if a[i][1] < b[j][1]: i += 1
            else: j += 1
        return out
    def paths(m, n):
        dp = [1]*n
        for _ in range(1, m):
            for c in range(1, n):
                dp[c] += dp[c-1]
        return dp[-1]
    def paths_block(g):
        R, C = len(g), len(g[0])
        dp = [0]*C
        dp[0] = 0 if g[0][0] else 1
        for r in range(R):
            for c in range(C):
                if g[r][c]: dp[c] = 0
                elif c: dp[c] += dp[c-1]
        return dp[-1]
    def min_path(g):
        R, C = len(g), len(g[0])
        dp = [10**9]*C
        dp[0] = 0
        for r in range(R):
            dp[0] += g[r][0]
            for c in range(1, C):
                dp[c] = min(dp[c], dp[c-1]) + g[r][c]
        return dp[-1]
    def islands(g):
        R, C = len(g), len(g[0])
        seen = [[False]*C for _ in range(R)]
        def dfs(r, c):
            if r<0 or c<0 or r>=R or c>=C or seen[r][c] or not g[r][c]: return
            seen[r][c] = True
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        n = 0
        for r in range(R):
            for c in range(C):
                if g[r][c] and not seen[r][c]:
                    n += 1; dfs(r, c)
        return n
    def max_area(g):
        R, C = len(g), len(g[0])
        seen = [[False]*C for _ in range(R)]
        def dfs(r, c):
            if r<0 or c<0 or r>=R or c>=C or seen[r][c] or not g[r][c]: return 0
            seen[r][c] = True
            return 1+dfs(r+1,c)+dfs(r-1,c)+dfs(r,c+1)+dfs(r,c-1)
        best = 0
        for r in range(R):
            for c in range(C):
                if g[r][c] and not seen[r][c]: best = max(best, dfs(r,c))
        return best
    def lakes(g):
        R, C = len(g), len(g[0])
        seen = [[False]*C for _ in range(R)]
        def dfs(r, c):
            if r<0 or c<0 or r>=R or c>=C or seen[r][c] or g[r][c]: return
            seen[r][c] = True
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        for r in range(R):
            for c in range(C):
                if r==0 or c==0 or r==R-1 or c==C-1: dfs(r,c)
        n = 0
        for r in range(R):
            for c in range(C):
                if not g[r][c] and not seen[r][c]:
                    n += 1; dfs(r,c)
        return n
    def rot(g):
        g = [row[:] for row in g]
        R, C = len(g), len(g[0])
        q = []; fresh = 0
        for r in range(R):
            for c in range(C):
                if g[r][c]==2: q.append((r,c))
                if g[r][c]==1: fresh += 1
        minutes = 0
        dirs = [(1,0),(-1,0),(0,1),(0,-1)]
        i = 0
        while i < len(q) and fresh:
            size = len(q) - i
            for _ in range(size):
                r,c = q[i]; i += 1
                for dr,dc in dirs:
                    nr,nc = r+dr,c+dc
                    if 0<=nr<R and 0<=nc<C and g[nr][nc]==1:
                        g[nr][nc]=2; fresh -= 1; q.append((nr,nc))
            minutes += 1
        return -1 if fresh else minutes
    def flood_color(image, sr, sc, color):
        g = [row[:] for row in image]
        start = g[sr][sc]
        if start == color: return g[sr][sc]
        R, C = len(g), len(g[0])
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C or g[r][c]!=start: return
            g[r][c]=color
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        dfs(sr,sc)
        return g[sr][sc]
    def dist_sum(mat):
        R, C = len(mat), len(mat[0])
        dist = [[10**9]*C for _ in range(R)]
        q = []
        for r in range(R):
            for c in range(C):
                if mat[r][c]==0:
                    dist[r][c]=0; q.append((r,c))
        dirs=[(1,0),(-1,0),(0,1),(0,-1)]; i=0
        while i < len(q):
            r,c=q[i]; i+=1
            for dr,dc in dirs:
                nr,nc=r+dr,c+dc
                if 0<=nr<R and 0<=nc<C and dist[nr][nc] > dist[r][c]+1:
                    dist[nr][nc]=dist[r][c]+1; q.append((nr,nc))
        return dist[0][0]+dist[R-1][C-1]
    def provinces(n, edges):
        parent=list(range(n))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        for a,b in edges: parent[find(a)]=find(b)
        return len({find(i) for i in range(n)})
    def redundant(n, edges):
        parent=list(range(n+1))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        for a,b in edges:
            pa,pb=find(a),find(b)
            if pa==pb: return [a,b]
            parent[pa]=pb
        return None
    def bipartite(n, edges):
        g=[[] for _ in range(n)]
        for a,b in edges:
            g[a].append(b); g[b].append(a)
        color=[0]*n
        for s in range(n):
            if color[s]: continue
            color[s]=1; q=[s]; i=0
            while i<len(q):
                u=q[i]; i+=1
                for v in g[u]:
                    if not color[v]:
                        color[v]=-color[u]; q.append(v)
                    elif color[v]==color[u]: return False
        return True
    def can_finish(n, edges):
        g=[[] for _ in range(n)]; indeg=[0]*n
        for a,b in edges:
            g[a].append(b); indeg[b]+=1
        q=[i for i in range(n) if indeg[i]==0]
        seen=0; i=0
        while i<len(q):
            u=q[i]; i+=1; seen+=1
            for v in g[u]:
                indeg[v]-=1
                if indeg[v]==0: q.append(v)
        return seen==n
    def delay(times, n, k):
        dist=[10**9]*(n+1); dist[k]=0
        for _ in range(n-1):
            for u,v,w in times:
                if dist[u]+w<dist[v]: dist[v]=dist[u]+w
        worst=max(dist[1:])
        return -1 if worst>=10**9 else worst
    def cheapest(n, flights, src, dst, k):
        dist=[10**9]*n; dist[src]=0
        for _ in range(k+1):
            nxt=dist[:]
            for u,v,w in flights:
                if dist[u]+w<nxt[v]: nxt[v]=dist[u]+w
            dist=nxt
        return -1 if dist[dst]>=10**9 else dist[dst]
    def effort(h):
        R,C=len(h),len(h[0])
        dist=[[10**9]*C for _ in range(R)]; dist[0][0]=0
        heap=[(0,0,0)]; dirs=[(1,0),(-1,0),(0,1),(0,-1)]
        seen=set()
        while heap:
            heap.sort()
            d,r,c=heap.pop(0)
            if (r,c) in seen: continue
            seen.add((r,c))
            if r==R-1 and c==C-1: return d
            for dr,dc in dirs:
                nr,nc=r+dr,c+dc
                if 0<=nr<R and 0<=nc<C:
                    nd=max(d, abs(h[nr][nc]-h[r][c]))
                    heap.append((nd,nr,nc))
        return -1
    def word_break(s, words):
        ws=set(words); dp=[False]*(len(s)+1); dp[0]=True
        for i in range(1,len(s)+1):
            for j in range(i):
                if dp[j] and s[j:i] in ws:
                    dp[i]=True; break
        return dp[-1]
    def word_count(s, words):
        ws=set(words); dp=[0]*(len(s)+1); dp[0]=1
        for i in range(1,len(s)+1):
            for j in range(i):
                if dp[j] and s[j:i] in ws: dp[i]+=dp[j]
        return dp[-1]
    def profit_u(a):
        return sum(max(0, a[i]-a[i-1]) for i in range(1,len(a)))
    def profit_fee(a, fee):
        cash, hold = 0, -a[0]
        for p in a[1:]:
            cash, hold = max(cash, hold+p-fee), max(hold, cash-p)
        return cash
    def profit_k(k, prices):
        if not prices: return 0
        if k >= len(prices)//2: return profit_u(prices)
        buy=[-10**9]*(k+1); sell=[0]*(k+1)
        for p in prices:
            for t in range(1,k+1):
                buy[t]=max(buy[t], sell[t-1]-p)
                sell[t]=max(sell[t], buy[t]+p)
        return sell[k]
    def labels(s):
        last={c:i for i,c in enumerate(s)}
        out=[]; start=end=0
        for i,c in enumerate(s):
            end=max(end, last[c])
            if i==end:
                out.append(end-start+1); start=i+1
        return out
    def scheduler(tasks, n):
        from collections import Counter
        count=sorted(Counter(tasks).values(), reverse=True)
        extra=sum(c==count[0] for c in count)
        return max(len(tasks), (count[0]-1)*(n+1)+extra)
    def reorg(s):
        from collections import Counter
        items=sorted(Counter(s).items(), key=lambda x:-x[1])
        if items[0][1] > (len(s)+1)//2: return ""
        out=[""]*len(s); i=0
        for ch,n in items:
            for _ in range(n):
                out[i]=ch; i+=2
                if i>=len(s): i=1
        return "".join(out)
    def straights(hand, group):
        from collections import Counter
        m=Counter(hand)
        for start in sorted(m):
            need=m[start]
            if not need: continue
            for i in range(group):
                if m[start+i] < need: return False
                m[start+i]-=need
        return True
    def fleets(target, pos, speed):
        cars=sorted(((p,(target-p)/speed[i]) for i,p in enumerate(pos)), reverse=True)
        n=time=0
        for _,t in cars:
            if t>time:
                n+=1; time=t
        return n
    def warmer(temps):
        out=[0]*len(temps); st=[]
        for i,t in enumerate(temps):
            while st and t>temps[st[-1]]:
                j=st.pop(); out[j]=i-j
            st.append(i)
        return out
    def next_taller(a):
        out=[-1]*len(a); st=[]
        for i,v in enumerate(a):
            while st and v>a[st[-1]]:
                out[st.pop()]=v
            st.append(i)
        return out
    def next_circ(a):
        n=len(a); out=[-1]*n; st=[]
        for i in range(2*n):
            v=a[i%n]
            while st and v>a[st[-1]]:
                out[st.pop()]=v
            if i<n: st.append(i)
        return out
    def asteroids(a):
        st=[]
        for n in a:
            alive=True
            while alive and n<0 and st and st[-1]>0:
                if st[-1] < -n: st.pop()
                elif st[-1]==-n: st.pop(); alive=False
                else: alive=False
            if alive: st.append(n)
        return st
    def rpn(tokens):
        st=[]
        for t in tokens:
            if t not in {"+","-","*","/"}:
                st.append(int(t))
            else:
                b=st.pop(); a=st.pop()
                if t=="+": st.append(a+b)
                elif t=="-": st.append(a-b)
                elif t=="*": st.append(a*b)
                else: st.append(int(a/b))
        return st[0]
    def decode(s):
        count=[]; prev=[]; cur=""; k=0
        for c in s:
            if c.isdigit(): k=k*10+int(c)
            elif c=="[":
                count.append(k); prev.append(cur); k=0; cur=""
            elif c=="]":
                cur=prev.pop()+cur*count.pop()
            else: cur+=c
        return cur
    def paren_score(s):
        st=[0]
        for c in s:
            if c=="(": st.append(0)
            else:
                v=st.pop(); st[-1]+=max(1, 2*v)
        return st[0]
    def longest_valid(s):
        best=0; st=[-1]
        for i,c in enumerate(s):
            if c=="(": st.append(i)
            else:
                st.pop()
                if not st: st.append(i)
                else: best=max(best, i-st[-1])
        return best
    def min_remove(s):
        a=list(s); st=[]
        for i,c in enumerate(a):
            if c=="(": st.append(i)
            elif c==")":
                if st: st.pop()
                else: a[i]=""
        for i in st: a[i]=""
        return "".join(a)
    def gas(gas, cost):
        tank=total=best=0
        for i,(g,c) in enumerate(zip(gas,cost)):
            tank += g-c; total += g-c
            if tank<0:
                best=i+1; tank=0
        return best if total>=0 else -1
    def candy(r):
        n=len(r); c=[1]*n
        for i in range(1,n):
            if r[i]>r[i-1]: c[i]=c[i-1]+1
        for i in range(n-2,-1,-1):
            if r[i]>r[i+1]: c[i]=max(c[i], c[i+1]+1)
        return sum(c)
    def wiggle(a):
        if len(a)<2: return len(a)
        up=down=1
        for i in range(1,len(a)):
            if a[i]>a[i-1]: up=down+1
            elif a[i]<a[i-1]: down=up+1
        return max(up, down)
    def triplet(a):
        first=second=10**18
        for n in a:
            if n<=first: first=n
            elif n<=second: second=n
            else: return True
        return False
    def jump(a):
        jumps=end=far=0
        for i in range(len(a)-1):
            far=max(far, i+a[i])
            if i==end:
                jumps+=1; end=far
        return jumps
    def can_jump(a):
        reach=0
        for i,n in enumerate(a):
            if i>reach: return False
            reach=max(reach, i+n)
        return True

    add("medium","sum-slice-count","Slices that sum to K","sumSliceCount(values: number[], k: number): number","Topic: prefix sums. Return how many contiguous slices add to k. Values may be negative.","sumSliceCount([1, 1, 1], 2)", subarray_sum([1,1,1],2))
    add("medium","divisible-slices","Divisible slices","divisibleSlices(values: number[], k: number): number","Topic: prefix sums. Return how many contiguous slices have a sum divisible by the positive integer k.","divisibleSlices([4, 5, 0, -2, -3, 1], 5)", sub_div([4,5,0,-2,-3,1],5))
    add("medium","shortest-cover-sum","Shortest cover sum","shortestCoverSum(target: number, values: number[]): number","Topic: sliding window. values are positive. Return the shortest slice length that adds to at least target, or 0.","shortestCoverSum(7, [2, 3, 1, 2, 4, 3])", min_len(7,[2,3,1,2,4,3]))
    add("medium","product-under","Product under K","productUnder(values: number[], k: number): number","Topic: sliding window. values are positive. Count slices whose product is strictly under k.","productUnder([10, 5, 2, 6], 100)", prod_under([10,5,2,6],100))
    add("medium","at-most-k-codes","At most K codes","atMostKCodes(signal: string, k: number): number","Topic: sliding window. Return the longest substring that uses at most k distinct letters.","atMostKCodes('eceba', 2)", at_most_k("eceba",2))
    add("medium","replace-to-repeat","Replace to repeat","replaceToRepeat(signal: string, budget: number): number","Topic: sliding window. You may change at most budget letters. Return the longest run of one letter you can make.","replaceToRepeat('AABABBA', 1)", replace_repeat("AABABBA",1))
    add("medium","holds-permutation","Holds a permutation","holdsPermutation(pattern: string, text: string): boolean","Topic: sliding window. Return whether any window of text is a rearrangement of pattern.","holdsPermutation('ab', 'eidbaooo')", inclusion("ab","eidbaooo"))
    add("medium","anagram-starts","Anagram starts","anagramStarts(pattern: string, text: string): number[]","Topic: sliding window. Return every start index whose window is a rearrangement of pattern.","anagramStarts('abc', 'cbaebabacd')", anagram_starts("abc","cbaebabacd"))
    add("medium","ones-with-flips","Ones with flips","onesWithFlips(bits: number[], budget: number): number","Topic: sliding window. bits are 0 and 1. Flip at most budget zeros. Return the longest run of ones.","onesWithFlips([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2)", ones_flip([1,1,1,0,0,0,1,1,1,1,0],2))
    add("medium","binary-sum-k","Binary slices summing to K","binarySumCount(bits: number[], k: number): number","Topic: sliding window. bits are 0 and 1. Count slices that add to exactly k.","binarySumCount([1, 0, 1, 0, 1], 2)", at_most_sum([1,0,1,0,1],2)-at_most_sum([1,0,1,0,1],1))
    add("medium","k-odd-slices","K odd slices","kOddSlices(values: number[], k: number): number","Topic: sliding window. Count slices that contain exactly k odd numbers.","kOddSlices([1, 1, 2, 1, 1], 3)", at_most_sum([n%2 for n in [1,1,2,1,1]],3)-at_most_sum([n%2 for n in [1,1,2,1,1]],2))
    add("medium","two-fruit-row","Two fruit row","twoFruitRow(trees: number[]): number","Topic: sliding window. Pick a contiguous row using at most two fruit types. Return the most fruit.","twoFruitRow([1, 2, 1])", fruit([1,2,1]))
    add("medium","insert-window","Insert a window","insertWindow(windows: [number, number][], next: [number, number]): [number, number][]","Topic: intervals. windows are sorted and disjoint, closed on both ends. Insert next and merge overlaps.","insertWindow([[1, 3], [6, 9]], [2, 5])", insert_iv([[1,3],[6,9]],[2,5]))
    add("medium","drop-overlaps","Drop overlaps","dropOverlaps(windows: [number, number][]): number","Topic: greedy. Each window is closed. Return how many to remove so the rest do not overlap, counting a shared endpoint as overlap.","dropOverlaps([[1, 2], [2, 3], [3, 4], [1, 3]])", erase([[1,2],[2,3],[3,4],[1,3]]))
    add("easy","one-room","One room","fitsOneRoom(meetings: [number, number][]): boolean","Topic: intervals. Each meeting is half-open [start, end). Return whether one room can hold them all.","fitsOneRoom([[0, 30], [5, 10], [15, 20]])", attend([[0,30],[5,10],[15,20]]))
    add("medium","shared-windows","Shared windows","sharedWindows(a: [number, number][], b: [number, number][]): [number, number][]","Topic: intervals. Both lists are sorted disjoint closed intervals. Return their intersection.","sharedWindows([[0, 2], [5, 10]], [[1, 5], [8, 12]])", shared([[0,2],[5,10]],[[1,5],[8,12]]))
    add("easy","grid-routes","Grid routes","gridRoutes(rows: number, cols: number): number","Topic: dynamic programming. Count paths from the top-left to the bottom-right moving only right or down.","gridRoutes(3, 7)", paths(3,7))
    add("medium","grid-routes-blocked","Grid routes with blocks","gridRoutesBlocked(grid: number[][]): number","Topic: dynamic programming. 1 is blocked. Count right-or-down paths from the top-left to the bottom-right.","gridRoutesBlocked([[0, 0, 0], [0, 1, 0], [0, 0, 0]])", paths_block([[0,0,0],[0,1,0],[0,0,0]]))
    add("medium","cheapest-grid-path","Cheapest grid path","cheapestGridPath(grid: number[][]): number","Topic: dynamic programming. Move only right or down. Cells are non-negative costs. Return the cheapest path.","cheapestGridPath([[1, 3, 1], [1, 5, 1], [4, 2, 1]])", min_path([[1,3,1],[1,5,1],[4,2,1]]))
    add("medium","land-count","Land count","landCount(grid: number[][]): number","Topic: graphs. 1 is land. Edge-adjacent land is one island. Return the island count.","landCount([[1, 1, 0], [0, 1, 0], [0, 0, 1]])", islands([[1,1,0],[0,1,0],[0,0,1]]))
    add("medium","largest-island","Largest island","largestIsland(grid: number[][]): number","Topic: graphs. Return the area of the largest edge-connected island of 1s.","largestIsland([[0, 1], [1, 1]])", max_area([[0,1],[1,1]]))
    add("medium","enclosed-lakes","Enclosed lakes","enclosedLakes(grid: number[][]): number","Topic: graphs. 0 is water. Count water regions that do not touch the border.","enclosedLakes([[1, 1, 1, 1], [1, 0, 0, 1], [1, 1, 0, 1], [1, 1, 1, 1]])", lakes([[1,1,1,1],[1,0,0,1],[1,1,0,1],[1,1,1,1]]))
    add("medium","rot-minutes","Rot minutes","rotMinutes(grid: number[][]): number","Topic: BFS. 2 is rotten, 1 is fresh, 0 is empty. Rot spreads to edge neighbors each minute. Return the minutes until nothing fresh remains, or -1.","rotMinutes([[2, 1, 1], [1, 1, 0], [0, 1, 1]])", rot([[2,1,1],[1,1,0],[0,1,1]]))
    add("easy","paint-cell","Paint one cell","paintCell(image: number[][], row: number, col: number, color: number): number","Topic: graphs. Recolor the edge-connected region of the starting color. Return the color now at the start cell.","paintCell([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2)", flood_color([[1,1,1],[1,1,0],[1,0,1]],1,1,2))
    add("medium","distance-sum","Corner distance to zero","cornerDistance(mat: number[][]): number","Topic: BFS. mat holds 0 and 1. Return the distance from the top-left to the nearest 0 plus the distance from the bottom-right to the nearest 0.","cornerDistance([[0, 0, 0], [0, 1, 0], [1, 1, 1]])", dist_sum([[0,0,0],[0,1,0],[1,1,1]]))
    add("medium","friend-circles","Friend circles","friendCircles(people: number, edges: [number, number][]): number","Topic: union-find. People are 0 through people-1. Undirected edges are friendships. Return the number of groups.","friendCircles(4, [[0, 1], [1, 2]])", provinces(4,[[0,1],[1,2]]))
    add("medium","extra-cable","Extra cable","extraCable(n: number, edges: [number, number][]): [number, number]","Topic: union-find. Nodes are 1 through n. One edge closes a cycle in what was a tree. Return that edge.","extraCable(3, [[1, 2], [1, 3], [2, 3]])", redundant(3,[[1,2],[1,3],[2,3]]))
    add("medium","two-teams","Two teams","twoTeams(people: number, edges: [number, number][]): boolean","Topic: graphs. Return whether the undirected graph is bipartite.","twoTeams(4, [[0, 1], [0, 3], [1, 2], [2, 3]])", bipartite(4,[[0,1],[0,3],[1,2],[2,3]]))
    add("medium","can-finish-modules","Can finish the modules","canFinishModules(n: number, edges: [number, number][]): boolean","Topic: topological sort. Edge [before, after] means before is a prerequisite of after. Return whether every module can be ordered.","canFinishModules(2, [[1, 0]])", can_finish(2,[[1,0]]))
    add("medium","signal-delay","Signal delay","signalDelay(times: [number, number, number][], n: number, source: number): number","Topic: shortest paths. Nodes are 1 through n. Each triple is a directed [from, to, minutes]. Return when every node has heard the signal from source, or -1.","signalDelay([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2)", delay([[2,1,1],[2,3,1],[3,4,1]],4,2))
    add("medium","cheapest-fare","Cheapest fare","cheapestFare(cities: number, flights: [number, number, number][], source: number, target: number, stops: number): number","Topic: dynamic programming. Cities are 0 through cities-1. Return the cheapest price with at most stops layovers, or -1.","cheapestFare(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1)", cheapest(4,[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],0,3,1))
    add("medium","least-effort","Least effort path","leastEffort(heights: number[][]): number","Topic: graphs. A path's effort is its largest absolute height change. Return the minimum effort from the top-left to the bottom-right.","leastEffort([[1, 2, 2], [3, 8, 2], [5, 3, 5]])", effort([[1,2,2],[3,8,2],[5,3,5]]))
    add("medium","can-segment","Can segment","canSegment(text: string, words: string[]): boolean","Topic: dynamic programming. Return whether text splits into dictionary words. Words may be reused.","canSegment('applepenapple', ['apple', 'pen'])", word_break("applepenapple",["apple","pen"]))
    add("hard","segment-count","Segment count","segmentCount(text: string, words: string[]): number","Topic: dynamic programming. Count ordered splits of text into dictionary words. Different cut positions are different ways.","segmentCount('catsanddog', ['cat', 'cats', 'and', 'sand', 'dog'])", word_count("catsanddog",["cat","cats","and","sand","dog"]))
    add("easy","unlimited-trades","Unlimited trades","unlimitedTrades(prices: number[]): number","Topic: greedy. You may buy and sell any number of times but hold at most one share. Return the best profit.","unlimitedTrades([7, 1, 5, 3, 6, 4])", profit_u([7,1,5,3,6,4]))
    add("medium","trades-with-fee","Trades with a fee","tradesWithFee(prices: number[], fee: number): number","Topic: dynamic programming. Each completed sale pays fee. Hold at most one share. Return the best profit.","tradesWithFee([1, 3, 2, 8, 4, 9], 2)", profit_fee([1,3,2,8,4,9],2))
    add("hard","at-most-k-trades","At most K trades","atMostKTrades(k: number, prices: number[]): number","Topic: dynamic programming. Complete at most k buy-then-sell trades. Return the best profit.","atMostKTrades(2, [3, 2, 6, 5, 0, 3])", profit_k(2,[3,2,6,5,0,3]))
    add("medium","label-parts","Label parts","labelParts(label: string): number[]","Topic: greedy. Split so each letter lives in only one part, using as many parts as possible. Return the part lengths.","labelParts('ababcbacadefegdehijhklij')", labels("ababcbacadefegdehijhklij"))
    add("medium","cooldown-tasks","Task cooldown","taskCooldown(tasks: string[], gap: number): number","Topic: greedy. The same letter needs at least gap other slots between runs. Idle slots are allowed. Return the shortest schedule.","taskCooldown(['A', 'A', 'A', 'B', 'B', 'B'], 2)", scheduler(["A","A","A","B","B","B"],2))
    add("medium","rearrange-letters","Rearrange letters","rearrangeLetters(text: string): string","Topic: greedy. Rearrange so no two adjacent letters match. Return any valid string, or empty if impossible.","rearrangeLetters('aab')", reorg("aab"))
    add("medium","straight-hand","Straight hand","straightHand(cards: number[], groupSize: number): boolean","Topic: greedy. Return whether the cards split into groups of groupSize consecutive values.","straightHand([1, 2, 3, 6, 2, 3, 4, 7, 8], 3)", straights([1,2,3,6,2,3,4,7,8],3))
    add("medium","fleet-count","Fleet count","fleetCount(target: number, position: number[], speed: number[]): number","Topic: stack. A faster car catches a slower car ahead and must match its speed. Return how many fleets arrive at target.","fleetCount(12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3])", fleets(12,[10,8,0,5,3],[2,4,1,1,3]))
    add("medium","warmer-days","Warmer days","warmerDays(temps: number[]): number[]","Topic: stack. For each day return how many days until a strictly warmer temperature, or 0.","warmerDays([73, 74, 75, 71, 69, 72, 76, 73])", warmer([73,74,75,71,69,72,76,73]))
    add("easy","next-taller","Next taller","nextTaller(heights: number[]): number[]","Topic: stack. For each index return the next strictly taller value to the right, or -1.","nextTaller([2, 1, 2, 4, 3])", next_taller([2,1,2,4,3]))
    add("medium","circular-taller","Circular next taller","circularTaller(heights: number[]): number[]","Topic: stack. The line wraps. Return the next strictly taller value, or -1.","circularTaller([1, 2, 1])", next_circ([1,2,1]))
    add("medium","asteroid-line","Asteroid line","asteroidLine(masses: number[]): number[]","Topic: stack. Positive moves right, negative moves left. On a collision the smaller explodes and equals both explode. Return what remains.","asteroidLine([5, 10, -5])", asteroids([5,10,-5]))
    add("medium","polish-value","Reverse Polish value","polishValue(tokens: string[]): number","Topic: stack. Evaluate reverse Polish tokens. Division truncates toward zero.","polishValue(['2', '1', '+', '3', '*'])", rpn(["2","1","+","3","*"]))
    add("medium","expand-pattern","Expand the pattern","expandPattern(pattern: string): string","Topic: stack. k[abc] repeats abc k times and patterns nest. Return the expansion.","expandPattern('3[a2[c]]')", decode("3[a2[c]]"))
    add("medium","paren-score","Parenthesis score","parenScore(text: string): number","Topic: stack. () scores 1, concatenation adds, and wrapping doubles. text is valid. Return the score.","parenScore('(()(()))')", paren_score("(()(()))"))
    add("hard","longest-valid-brackets","Longest valid brackets","longestValidBrackets(text: string): number","Topic: stack. Return the length of the longest valid parenthesis substring.","longestValidBrackets(')()())')", longest_valid(")()())"))
    add("medium","min-bracket-edits","Minimum bracket edits","minBracketEdits(text: string): string","Topic: stack. Delete the fewest parentheses so the string is valid. Return any such string.","minBracketEdits('lee(t(c)o)de)')", min_remove("lee(t(c)o)de)"))
    add("medium","circuit-start","Circuit start","circuitStart(gas: number[], cost: number[]): number","Topic: greedy. gas[i] fills the tank and cost[i] is the fuel to the next station, wrapping around. Return the unique start that completes a circuit, or -1.","circuitStart([1, 2, 3, 4, 5], [3, 4, 5, 1, 2])", gas([1,2,3,4,5],[3,4,5,1,2]))
    add("hard","candy-line","Candy line","candyLine(ratings: number[]): number","Topic: greedy. Each child gets at least one candy, and a higher rating than a neighbor gets more than that neighbor. Return the minimum total.","candyLine([1, 0, 2])", candy([1,0,2]))
    add("medium","wiggle-length","Wiggle length","wiggleLength(values: number[]): number","Topic: dynamic programming. A wiggle alternates up and down. Equals do not extend it. Return the longest wiggle subsequence.","wiggleLength([1, 7, 4, 9, 2, 5])", wiggle([1,7,4,9,2,5]))
    add("medium","rising-triple","Rising triple","hasRisingTriple(values: number[]): boolean","Topic: greedy. Return whether three increasing values appear in order, not necessarily contiguous.","hasRisingTriple([1, 2, 3, 4, 5])", triplet([1,2,3,4,5]))
    add("medium","fewest-jumps","Fewest jumps","fewestJumps(jumps: number[]): number","Topic: greedy. jumps[i] is how far you may leap from i. Return the fewest leaps from the first index to the last. The end is reachable.","fewestJumps([2, 3, 1, 1, 4])", jump([2,3,1,1,4]))
    add("medium","can-reach-end","Can reach the end","canReachEnd(jumps: number[]): boolean","Topic: greedy. Return whether the last index is reachable when jumps[i] is the farthest leap from i.","canReachEnd([2, 3, 1, 1, 4])", can_jump([2,3,1,1,4]))
