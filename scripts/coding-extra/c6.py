
def register(add):
    def no_repeat(s):
        last={}; i=best=0
        for j,c in enumerate(s):
            if c in last and last[c]>=i: i=last[c]+1
            last[c]=j; best=max(best, j-i+1)
        return best
    def min_window(s, t):
        from collections import Counter
        need=Counter(t); missing=len(t); i=0; best=None
        for j,c in enumerate(s):
            if need[c]>0: missing-=1
            need[c]-=1
            while missing==0:
                if best is None or j-i<best[0]: best=(j-i, i)
                need[s[i]]+=1
                if need[s[i]]>0: missing+=1
                i+=1
        return 0 if best is None else best[0]+1
    def groups(words):
        return len({tuple(sorted(w)) for w in words})
    def consecutive(a):
        s=set(a); best=0
        for n in s:
            if n-1 in s: continue
            cur=n
            while cur in s: cur+=1
            best=max(best, cur-n)
        return best
    def find_dup(a):
        b=a[:]
        while b[0]!=b[b[0]]:
            b[b[0]], b[0] = b[0], b[b[0]]
        return b[0]
    def say(n):
        s="1"
        for _ in range(n-1):
            out=[]; i=0
            while i<len(s):
                j=i
                while j<len(s) and s[j]==s[i]: j+=1
                out.append(str(j-i)+s[i]); i=j
            s="".join(out)
        return s
    def remove_k(num, k):
        st=[]
        for c in num:
            while k and st and st[-1]>c:
                st.pop(); k-=1
            st.append(c)
        while k:
            st.pop(); k-=1
        out="".join(st).lstrip("0")
        return out or "0"
    def largest_num(nums):
        from functools import cmp_to_key
        arr=[str(n) for n in nums]
        arr.sort(key=cmp_to_key(lambda a,b: -1 if a+b>b+a else 1 if a+b<b+a else 0))
        out="".join(arr).lstrip("0")
        return out or "0"
    def span(prices):
        st=[]; out=[]
        for i,p in enumerate(prices):
            while st and prices[st[-1]]<=p: st.pop()
            out.append(i+1 if not st else i-st[-1])
            st.append(i)
        return out
    def sub_mins(a):
        MOD=10**9+7; n=len(a); left=[-1]*n; right=[n]*n; st=[]
        for i,v in enumerate(a):
            while st and a[st[-1]]>v: st.pop()
            left[i]=st[-1] if st else -1; st.append(i)
        st=[]
        for i in range(n-1,-1,-1):
            while st and a[st[-1]]>=a[i]: st.pop()
            right[i]=st[-1] if st else n; st.append(i)
        return sum(a[i]*(i-left[i])*(right[i]-i) for i in range(n))%MOD
    def four_sum_count(A,B,C,D):
        from collections import Counter
        left=Counter(a+b for a in A for b in B)
        return sum(left[-(c+d)] for c in C for d in D)
    def four_count(a, target):
        b=sorted(a); n=len(b); count=0
        for i in range(n):
            if i and b[i]==b[i-1]: continue
            for j in range(i+1,n):
                if j>i+1 and b[j]==b[j-1]: continue
                l,r=j+1,n-1
                while l<r:
                    s=b[i]+b[j]+b[l]+b[r]
                    if s==target:
                        count+=1; l+=1; r-=1
                        while l<r and b[l]==b[l-1]: l+=1
                        while l<r and b[r]==b[r+1]: r-=1
                    elif s<target: l+=1
                    else: r-=1
        return count
    def patch(nums, n):
        miss=1; i=added=0
        while miss<=n:
            if i<len(nums) and nums[i]<=miss:
                miss+=nums[i]; i+=1
            else:
                miss+=miss; added+=1
        return added
    def life(board):
        R,C=len(board),len(board[0]); dirs=[(dr,dc) for dr in (-1,0,1) for dc in (-1,0,1) if dr or dc]
        nxt=[[0]*C for _ in range(R)]
        for r in range(R):
            for c in range(C):
                live=sum(board[r+dr][c+dc] for dr,dc in dirs if 0<=r+dr<R and 0<=c+dc<C)
                nxt[r][c]=1 if live==3 or (live==2 and board[r][c]) else 0
        return sum(sum(row) for row in nxt)
    def search2(grid, target):
        if not grid: return False
        r,c=0,len(grid[0])-1
        while r<len(grid) and c>=0:
            if grid[r][c]==target: return True
            if grid[r][c]>target: c-=1
            else: r+=1
        return False
    def concat(s, words):
        if not words: return []
        L=len(words[0]); n=len(words); from collections import Counter
        need=Counter(words); out=[]
        for offset in range(L):
            seen=Counter(); start=offset; count=0
            for i in range(offset, len(s)-L+1, L):
                w=s[i:i+L]
                if w in need:
                    seen[w]+=1; count+=1
                    while seen[w]>need[w]:
                        seen[s[start:start+L]]-=1; count-=1; start+=L
                    if count==n: out.append(start)
                else:
                    seen.clear(); count=0; start=i+L
        return out
    def open_lock(dead, target):
        dead=set(dead)
        if "0000" in dead: return -1
        from collections import deque
        q=deque([("0000",0)]); seen={"0000"}
        while q:
            cur,d=q.popleft()
            if cur==target: return d
            for i in range(4):
                for delta in (-1,1):
                    nxt=cur[:i]+str((int(cur[i])+delta)%10)+cur[i+1:]
                    if nxt not in seen and nxt not in dead:
                        seen.add(nxt); q.append((nxt,d+1))
        return -1
    def bridge(grid):
        R,C=len(grid),len(grid[0]); seen=[[False]*C for _ in range(R)]
        q=[]
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C or seen[r][c] or grid[r][c]==0: return
            seen[r][c]=True; q.append((r,c))
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        found=False
        for r in range(R):
            for c in range(C):
                if grid[r][c]:
                    dfs(r,c); found=True; break
            if found: break
        steps=0
        dirs=[(1,0),(-1,0),(0,1),(0,-1)]
        while q:
            nxt=[]
            for r,c in q:
                for dr,dc in dirs:
                    nr,nc=r+dr,c+dc
                    if nr<0 or nc<0 or nr>=R or nc>=C or seen[nr][nc]: continue
                    if grid[nr][nc]==1: return steps
                    seen[nr][nc]=True; nxt.append((nr,nc))
            q=nxt; steps+=1
        return -1
    def pacific(h):
        R,C=len(h),len(h[0])
        def reach(starts):
            seen=set(starts); q=list(starts)
            while q:
                r,c=q.pop()
                for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                    nr,nc=r+dr,c+dc
                    if 0<=nr<R and 0<=nc<C and (nr,nc) not in seen and h[nr][nc]>=h[r][c]:
                        seen.add((nr,nc)); q.append((nr,nc))
            return seen
        a=reach([(0,c) for c in range(C)]+[(r,0) for r in range(R)])
        b=reach([(R-1,c) for c in range(C)]+[(r,C-1) for r in range(R)])
        return len(a&b)
    def enclaves(g):
        R,C=len(g),len(g[0]); seen=[[False]*C for _ in range(R)]
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C or seen[r][c] or not g[r][c]: return
            seen[r][c]=True
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        for r in range(R):
            dfs(r,0); dfs(r,C-1)
        for c in range(C):
            dfs(0,c); dfs(R-1,c)
        return sum(g[r][c] and not seen[r][c] for r in range(R) for c in range(C))
    def large_island(g):
        R,C=len(g),len(g[0]); idx=[[0]*C for _ in range(R)]; sizes={}; cur=1
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C or idx[r][c] or not g[r][c]: return 0
            idx[r][c]=cur
            return 1+dfs(r+1,c)+dfs(r-1,c)+dfs(r,c+1)+dfs(r,c-1)
        for r in range(R):
            for c in range(C):
                if g[r][c] and not idx[r][c]:
                    sizes[cur]=dfs(r,c); cur+=1
        best=max(sizes.values(), default=0)
        for r in range(R):
            for c in range(C):
                if g[r][c]: continue
                ids=set()
                for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                    nr,nc=r+dr,c+dc
                    if 0<=nr<R and 0<=nc<C and idx[nr][nc]: ids.add(idx[nr][nc])
                best=max(best, 1+sum(sizes[i] for i in ids))
        return best
    def swim(grid):
        R=len(grid); import heapq
        dist=[[10**9]*R for _ in range(R)]; dist[0][0]=grid[0][0]
        heap=[(grid[0][0],0,0)]
        while heap:
            d,r,c=heapq.heappop(heap)
            if d!=dist[r][c]: continue
            if r==R-1 and c==R-1: return d
            for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr,nc=r+dr,c+dc
                if 0<=nr<R and 0<=nc<R:
                    nd=max(d, grid[nr][nc])
                    if nd<dist[nr][nc]:
                        dist[nr][nc]=nd; heapq.heappush(heap,(nd,nr,nc))
        return -1
    def bin_path(grid):
        R=len(grid)
        if grid[0][0] or grid[-1][-1]: return -1
        from collections import deque
        q=deque([(0,0,1)]); seen={(0,0)}
        while q:
            r,c,d=q.popleft()
            if r==R-1 and c==R-1: return d
            for dr,dc in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                nr,nc=r+dr,c+dc
                if 0<=nr<R and 0<=nc<R and not grid[nr][nc] and (nr,nc) not in seen:
                    seen.add((nr,nc)); q.append((nr,nc,d+1))
        return -1
    def keys(rooms):
        seen={0}; stack=[0]
        while stack:
            u=stack.pop()
            for v in rooms[u]:
                if v not in seen:
                    seen.add(v); stack.append(v)
        return len(seen)==len(rooms)
    def surrounded(board):
        R,C=len(board),len(board[0]); board=[row[:] for row in board]
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C or board[r][c]!="O": return
            board[r][c]="#"; dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        for r in range(R):
            dfs(r,0); dfs(r,C-1)
        for c in range(C):
            dfs(0,c); dfs(R-1,c)
        return sum(cell=="O" for row in board for cell in row)
    def inform(managers, head, inform_time):
        from collections import defaultdict
        kids=defaultdict(list)
        for i,m in enumerate(managers):
            if m>=0: kids[m].append(i)
        def dfs(u):
            return inform_time[u] + (max((dfs(v) for v in kids[u]), default=0))
        return dfs(head)
    def divisor_game(n):
        return n%2==0
    def nim(n):
        return n%4!=0
    def winner_square(n):
        dp=[False]*(n+1)
        for i in range(1,n+1):
            s=1
            while s*s<=i:
                if not dp[i-s*s]:
                    dp[i]=True; break
                s+=1
        return dp[n]
    def can_win(max_choosable, total):
        if (max_choosable*(max_choosable+1))//2<total: return False
        memo={}
        def dfs(mask, left):
            if mask in memo: return memo[mask]
            for i in range(1,max_choosable+1):
                bit=1<<(i-1)
                if mask&bit: continue
                if i>=left or not dfs(mask|bit, left-i):
                    memo[mask]=True; return True
            memo[mask]=False; return False
        return dfs(0, total)
    def stone3(values):
        n=len(values); prefix=[0]
        for v in values: prefix.append(prefix[-1]+v)
        dp=[[0]*n for _ in range(n)]
        for length in range(2,n+1):
            for i in range(n-length+1):
                j=i+length-1; dp[i][j]=10**18
                for k in range(i,j):
                    dp[i][j]=min(dp[i][j], dp[i][k]+dp[k+1][j]+prefix[j+1]-prefix[i])
        # merge stones with K=2 is just prefix? This is stone game merge for K=2 which is always sum*(n-1) if n>1 else 0. Use K=2 special.
        return 0 if n<2 else prefix[-1]*(n-1) if False else dp[0][n-1]
    def partition_k(nums, k):
        total=sum(nums)
        if total%k: return False
        target=total//k
        if max(nums)>target: return False
        nums=sorted(nums, reverse=True)
        buckets=[0]*k
        def dfs(i):
            if i==len(nums): return True
            for b in range(k):
                if buckets[b]+nums[i]<=target:
                    buckets[b]+=nums[i]
                    if dfs(i+1): return True
                    buckets[b]-=nums[i]
                if buckets[b]==0: break
            return False
        return dfs(0)
    def eval_div(equations, values, queries):
        from collections import defaultdict
        g=defaultdict(dict)
        for (a,b),v in zip(equations, values):
            g[a][b]=v; g[b][a]=1/v
        def dfs(src, dst, seen):
            if src not in g or dst not in g: return -1.0
            if src==dst: return 1.0
            seen.add(src)
            for nxt,w in g[src].items():
                if nxt in seen: continue
                got=dfs(nxt, dst, seen)
                if got>0: return w*got
            return -1.0
        return [dfs(a,b,set()) for a,b in queries]
    def calendar(bookings):
        ok=[]
        taken=[]
        for s,e in bookings:
            clash=False
            for a,b in taken:
                if not (e<=a or s>=b): clash=True
            if clash: ok.append(False)
            else:
                taken.append((s,e)); ok.append(True)
        return ok
    def flights(bookings, n):
        delta=[0]*(n+1)
        for a,b,c in bookings:
            delta[a-1]+=c; delta[b]-=c
        out=[]; run=0
        for i in range(n):
            run+=delta[i]; out.append(run)
        return out
    def free_time(schedule):
        iv=[]
        for person in schedule: iv.extend(person)
        iv.sort()
        merged=[]
        for s,e in iv:
            if not merged or s>merged[-1][1]: merged.append([s,e])
            else: merged[-1][1]=max(merged[-1][1], e)
        out=[]
        for i in range(1,len(merged)):
            if merged[i][0]>merged[i-1][1]: out.append([merged[i-1][1], merged[i][0]])
        return out
    def course3(courses):
        import heapq
        courses=sorted(courses, key=lambda c:c[1])
        time=0; heap=[]
        for dur,last in courses:
            time+=dur; heapq.heappush(heap, -dur)
            if time>last:
                time+=heapq.heappop(heap)
        return len(heap)
    def ipo(k, w, profits, capital):
        import heapq
        items=sorted(zip(capital, profits))
        i=0; heap=[]
        for _ in range(k):
            while i<len(items) and items[i][0]<=w:
                heapq.heappush(heap, -items[i][1]); i+=1
            if not heap: break
            w+=-heapq.heappop(heap)
        return w
    def ugly2(n, primes):
        import heapq
        heap=[1]; seen={1}
        for _ in range(n-1):
            cur=heapq.heappop(heap)
            for p in primes:
                nxt=cur*p
                if nxt not in seen:
                    seen.add(nxt); heapq.heappush(heap, nxt)
        return heapq.heappop(heap)
    def short_pal(s):
        rev=s[::-1]
        # chars to add = n - longest prefix palindrome via KMP of s+#+rev
        t=s+"#"+rev
        pi=[0]*len(t); k=0
        for i in range(1,len(t)):
            while k and t[k]!=t[i]: k=pi[k-1]
            if t[k]==t[i]: k+=1
            pi[i]=k
        return len(s)-pi[-1]
    def stock_ii_already():
        return 0
    add("medium","no-repeat-slice","Longest slice without a repeat","noRepeatSlice(text: string): number","Topic: sliding window. Return the longest substring whose letters are all different.","noRepeatSlice('abbaec')", no_repeat("abbaec"))
    add("hard","cover-length","Cover length","coverLength(log: string, need: string): number","Topic: sliding window. Return the length of the shortest slice of log that covers every character of need with at least the required counts. Return 0 if none exists.","coverLength('ADOBECODEBANC', 'ABC')", min_window("ADOBECODEBANC","ABC"))
    add("easy","anagram-group-count","Anagram group count","anagramGroupCount(words: string[]): number","Topic: hashing. Group words that use the same letters with the same counts. Return how many groups there are.","anagramGroupCount(['eat','tea','tan','ate','nat','bat'])", groups(["eat","tea","tan","ate","nat","bat"]))
    add("medium","consecutive-run","Consecutive values","consecutiveRun(values: number[]): number","Topic: hashing. Return the longest run of consecutive values, ignoring order and duplicates.","consecutiveRun([100, 4, 200, 1, 3, 2])", consecutive([100,4,200,1,3,2]))
    add("medium","repeat-cycle","Repeated cycle","repeatCycle(ids: number[]): number","Topic: cycles. ids holds n+1 integers drawn from 1 through n, so one value repeats. Return the repeated value. The cycle meets at that value.","repeatCycle([1, 3, 4, 2, 2])", find_dup([1,3,4,2,2]))
    add("medium","count-and-say","Count and say","countAndSay(n: number): string","Topic: strings. Start from '1'. Each next term counts consecutive digits. Return term n, with n starting at 1.","countAndSay(4)", say(4))
    add("medium","drop-k-digits","Drop K digits","dropDigits(number: string, k: number): string","Topic: stack. number is a non-negative integer without leading zeros, unless it is zero. Delete k digits so the remaining number is as small as possible. Return it without leading zeros.","dropDigits('1432219', 3)", remove_k("1432219",3))
    add("medium","largest-arrangement","Largest arrangement","largestArrangement(values: number[]): string","Topic: sorting. Arrange the values so their decimal concatenation is the largest possible. Return that numeral without a leading zero unless the value is zero.","largestArrangement([3, 30, 34, 5, 9])", largest_num([3,30,34,5,9]))
    add("medium","price-span","Price span","priceSpan(prices: number[]): number[]","Topic: stack. For each day, return how many consecutive earlier days, including today, have a price less than or equal to today's.","priceSpan([100, 80, 60, 70, 60, 75, 85])", span([100,80,60,70,60,75,85]))
    add("hard","slice-minimums","Sum of slice minimums","sliceMinimums(values: number[]): number","Topic: stack. Sum, over every contiguous slice, the minimum value in that slice. Return the total modulo 1000000007.","sliceMinimums([3, 1, 2, 4])", sub_mins([3,1,2,4]))
    add("medium","four-list-sums","Four list sums","fourListSums(a: number[], b: number[], c: number[], d: number[]): number","Topic: hashing. Count tuples that take one value from each list and add to 0.","fourListSums([1, 2], [-2, -1], [-1, 2], [0, 2])", four_sum_count([1,2],[-2,-1],[-1,2],[0,2]))
    add("hard","quartet-count","Quartet count","quartetCount(values: number[], target: number): number","Topic: two pointers. Count unordered selections of four different indexes that add to target. Identical multisets count once.","quartetCount([1, 0, -1, 0, -2, 2], 0)", four_count([1,0,-1,0,-2,2],0))
    add("hard","patch-range","Patch the range","patchRange(values: number[], n: number): number","Topic: greedy. values is a sorted list of positive integers. You may insert numbers. Return the fewest inserts so every integer from 1 through n can be formed as a sum of a subset.","patchRange([1, 3], 6)", patch([1,3],6))
    add("medium","next-generation","Next generation","nextGeneration(board: number[][]): number","Topic: simulation. 1 is live. A live cell with two or three live neighbors stays live. A dead cell with three live neighbors becomes live. Return how many cells are live after one step.","nextGeneration([[0,1,0],[0,0,1],[1,1,1],[0,0,0]])", life([[0,1,0],[0,0,1],[1,1,1],[0,0,0]]))
    add("medium","sorted-grid-search","Search a sorted grid","sortedGridSearch(grid: number[][], target: number): boolean","Topic: binary search. Each row and each column is sorted ascending. Return whether target occurs.","sortedGridSearch([[1, 4, 7], [2, 5, 8], [3, 6, 9]], 5)", search2([[1,4,7],[2,5,8],[3,6,9]],5))
    add("hard","word-strip-starts","Concatenated word starts","wordStripStarts(text: string, words: string[]): number[]","Topic: sliding window. words are the same length. Return every index where a concatenation of each word exactly once begins. Order the indexes ascending.","wordStripStarts('barfoothefoobarman', ['foo', 'bar'])", concat("barfoothefoobarman",["foo","bar"]))
    add("medium","open-lock","Open the lock","openLock(deadEnds: string[], target: string): number","Topic: BFS. A lock shows 4 digits. One move turns one digit by one, wrapping between 0 and 9. deadEnds jam the lock. Start at 0000. Return the fewest moves to target, or -1.","openLock(['0201', '0101', '0102', '1212', '2002'], '0202')", open_lock(["0201","0101","0102","1212","2002"],"0202"))
    add("medium","shortest-bridge","Shortest bridge","shortestBridge(grid: number[][]): number","Topic: BFS. The grid has exactly two islands of 1s. Return the fewest 0s to flip to connect them.","shortestBridge([[0,1],[1,0]])", bridge([[0,1],[1,0]]))
    add("medium","two-oceans","Cells that reach both oceans","twoOceans(heights: number[][]): number","Topic: graphs. The top and left edges drain to one ocean. The bottom and right drain to the other. Water flows to an equal or lower neighbor. Return how many cells can reach both oceans.","twoOceans([[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]])", pacific([[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]))
    add("medium","land-enclaves","Land enclaves","landEnclaves(grid: number[][]): number","Topic: graphs. 1 is land. Count land cells that cannot walk to the border by edge moves.","landEnclaves([[0,0,0,0],[1,0,1,0],[0,1,1,0],[0,0,0,0]])", enclaves([[0,0,0,0],[1,0,1,0],[0,1,1,0],[0,0,0,0]]))
    add("hard","one-flip-island","Largest island after one flip","oneFlipIsland(grid: number[][]): number","Topic: graphs. You may change one 0 to 1. Return the largest island you can make. Doing nothing is allowed.","oneFlipIsland([[1,0],[0,1]])", large_island([[1,0],[0,1]]))
    add("hard","rising-water","Path through rising water","risingWater(grid: number[][]): number","Topic: graphs. At time t you may step on cells whose value is at most t. Move to edge neighbors. Return the earliest time you can reach the bottom-right from the top-left. You may wait.","risingWater([[0,2],[1,3]])", swim([[0,2],[1,3]]))
    add("medium","eight-way-path","Eight-way clear path","eightWayPath(grid: number[][]): number","Topic: BFS. 0 is open. You may step to any of the eight neighbors. Return the fewest steps from the top-left to the bottom-right, or -1. Count the starting cell as step 1.","eightWayPath([[0,1],[1,0]])", bin_path([[0,1],[1,0]]))
    add("easy","visit-rooms","Visit every room","canVisitRooms(rooms: number[][]): boolean","Topic: graphs. rooms[i] lists the keys inside room i. Start in room 0. Return whether every room can be entered.","canVisitRooms([[1],[2],[3],[]])", keys([[1],[2],[3],[]]))
    add("medium","captured-region","Captured cells","capturedCells(board: string[][]): number","Topic: graphs. 'O' regions that do not touch the border are captured. Return how many O cells get captured.","capturedCells([['X','X','X','X'],['X','O','O','X'],['X','X','O','X'],['X','O','X','X']])", surrounded([["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]))
    add("medium","inform-time","Time to inform","informTime(managers: number[], head: number, minutes: number[]): number","Topic: trees. managers[i] is the manager of employee i, or -1 for the head. minutes[i] is how long i takes to inform direct reports. Return the minutes until everyone knows, starting from head.","informTime([2, 2, -1, 2, 2], 2, [0, 0, 1, 0, 0])", inform([2,2,-1,2,2],2,[0,0,1,0,0]))
    add("easy","divisor-game","Divisor game","divisorGameWin(n: number): boolean","Topic: games. Start with n. A move chooses 0 < x < n with n divisible by x and replaces n with n-x. The player who faces 0 loses? The player who cannot move loses. Both play optimally. Return whether the first player wins.","divisorGameWin(2)", divisor_game(2))
    add("easy","nim-stones","Nim stones","nimWin(n: number): boolean","Topic: games. A pile has n stones. A move takes 1, 2, or 3. The player who takes the last stone wins. Return whether the first player wins with optimal play.","nimWin(4)", nim(4))
    add("medium","square-game","Square game","squareGameWin(n: number): boolean","Topic: games. A move subtracts a positive perfect square not larger than the current number. The player who faces 0 loses. Return whether the first player wins from n.","squareGameWin(1)", winner_square(1))
    add("medium","choose-to-100","Choose without reaching","firstCanReach(maxChoice: number, target: number): boolean","Topic: games. Players alternately pick a fresh integer from 1 through maxChoice. The player who makes the running total reach or pass target wins. Return whether the first player wins. Integers cannot be reused.","firstCanReach(10, 11)", can_win(10,11))
    add("hard","equal-k-parts","K equal parts","canPartitionK(values: number[], k: number): boolean","Topic: backtracking. Return whether the values can be split into k groups with the same sum.","canPartitionK([4, 3, 2, 3, 5, 2, 1], 4)", partition_k([4,3,2,3,5,2,1],4))
    add("medium","division-queries","Division queries","divisionQueries(equations: [string, string][], values: number[], queries: [string, string][]): number[]","Topic: graphs. Each equation a/b = values[i]. For each query, return a/b, or -1 if it cannot be determined.","divisionQueries([['a','b'],['b','c']], [2.0, 3.0], [['a','c'],['b','a'],['a','e']])", eval_div([["a","b"],["b","c"]],[2.0,3.0],[["a","c"],["b","a"],["a","e"]]))
    add("medium","calendar-bookings","Calendar bookings","calendarBookings(bookings: [number, number][]): boolean[]","Topic: intervals. Each booking is half-open [start, end). Accept it only if it does not overlap an accepted booking. Return whether each booking, in order, was accepted.","calendarBookings([[10, 20], [15, 25], [20, 30]])", calendar([[10,20],[15,25],[20,30]]))
    add("medium","flight-bookings","Flight bookings","flightBookings(bookings: [number, number, number][], flights: number): number[]","Topic: difference array. A booking [first, last, seats] adds seats to flights first through last, numbered from 1. Return the seats on each flight.","flightBookings([[1, 2, 10], [2, 3, 20], [2, 5, 25]], 5)", flights([[1,2,10],[2,3,20],[2,5,25]],5))
    add("hard","common-free-time","Common free time","commonFreeTime(schedules: [number, number][][]): [number, number][]","Topic: intervals. Each person has sorted busy intervals [start, end). Return the positive-length gaps when everyone is free, between the first and last busy time, sorted.","commonFreeTime([[[1, 2], [5, 6]], [[1, 3]], [[4, 10]]])", free_time([[[1,2],[5,6]],[[1,3]],[[4,10]]]))
    add("hard","course-deadline","Courses before deadlines","coursesBeforeDeadline(courses: [number, number][]): number","Topic: heaps. A course is [duration, lastDay] and must finish on or before lastDay. You start at day 0 and take one course at a time. Return the most courses you can finish.","coursesBeforeDeadline([[100, 200], [200, 1300], [1000, 1250], [2000, 3200]])", course3([[100,200],[200,1300],[1000,1250],[2000,3200]]))
    add("hard","startup-capital","Startup capital","startupCapital(picks: number, capital: number, profits: number[], costs: number[]): number","Topic: heaps. Project i needs costs[i] capital on hand and then adds profits[i]. You may complete at most picks projects. Return the most capital you can reach, starting from capital.","startupCapital(2, 0, [1, 2, 3], [0, 1, 1])", ipo(2,0,[1,2,3],[0,1,1]))
    add("medium","super-ugly","Nth super ugly","nthSuperUgly(n: number, primes: number[]): number","Topic: heaps. A super ugly number is 1 or a product of the given primes. Return the nth, counting from 1.","nthSuperUgly(12, [2, 7, 13, 19])", ugly2(12,[2,7,13,19]))
    add("hard","chars-to-palindrome","Characters to prepend","charsToPalindrome(text: string): number","Topic: strings. Return how many characters you must prepend so text becomes a palindrome.","charsToPalindrome('aacecaaa')", short_pal("aacecaaa"))
