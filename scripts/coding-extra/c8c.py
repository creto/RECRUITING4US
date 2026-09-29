
def register(add):
    def paren_ways(expr):
        def ways(s):
            if s.isdigit(): return [int(s)]
            out=[]
            for i,c in enumerate(s):
                if c in "+-*":
                    for L in ways(s[:i]):
                        for R in ways(s[i+1:]):
                            out.append(L+R if c=="+" else L-R if c=="-" else L*R)
            return out
        return len(set(ways(expr)))
    def calc2(s):
        st=[]; num=0; sign="+"; s=s.replace(" ","")+"+"
        for c in s:
            if c.isdigit(): num=num*10+int(c); continue
            if sign=="+": st.append(num)
            elif sign=="-": st.append(-num)
            elif sign=="*": st.append(st.pop()*num)
            else: st.append(int(st.pop()/num))
            sign=c; num=0
        return sum(st)
    def cmp_ver(a,b):
        A=[int(x) for x in a.split(".")]; B=[int(x) for x in b.split(".")]
        L=max(len(A),len(B)); A+=[0]*(L-len(A)); B+=[0]*(L-len(B))
        return (A>B)-(A<B)
    def longest_prefix(strs):
        pref=strs[0]
        for s in strs[1:]:
            while not s.startswith(pref):
                pref=pref[:-1]
                if not pref: return ""
        return pref
    def zigzag(s, rows):
        if rows==1 or rows>=len(s): return s
        lines=[""]*rows; r=0; step=1
        for c in s:
            lines[r]+=c
            if r==0: step=1
            elif r==rows-1: step=-1
            r+=step
        return "".join(lines)
    def provinces(grid):
        n=len(grid); seen=[False]*n
        def dfs(u):
            seen[u]=True
            for v in range(n):
                if grid[u][v] and not seen[v]: dfs(v)
        return sum(dfs(i) or True for i in range(n) if not seen[i])
    def closed(g):
        R,C=len(g),len(g[0]); g=[row[:] for row in g]
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C: return False
            if g[r][c]: return True
            g[r][c]=1
            return all(dfs(r+dr,c+dc) for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)))
        return sum(g[r][c]==0 and dfs(r,c) for r in range(R) for c in range(C))
    def min_reorder(n, connections):
        from collections import defaultdict
        g=defaultdict(list)
        for a,b in connections:
            g[a].append((b,1)); g[b].append((a,0))
        seen={0}; stack=[0]; ans=0
        while stack:
            u=stack.pop()
            for v,cost in g[u]:
                if v not in seen:
                    seen.add(v); ans+=cost; stack.append(v)
        return ans
    def make_connected(n, connections):
        if len(connections)<n-1: return -1
        parent=list(range(n))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        for a,b in connections: parent[find(a)]=find(b)
        return len({find(i) for i in range(n)})-1
    def find_judge(n, trust):
        score=[0]*(n+1)
        for a,b in trust:
            score[a]-=1; score[b]+=1
        for i in range(1,n+1):
            if score[i]==n-1: return i
        return -1
    def critical(n, connections):
        from collections import defaultdict
        g=defaultdict(list)
        for a,b in connections:
            g[a].append(b); g[b].append(a)
        tin=[-1]*n; low=[0]*n; t=[0]; ans=0
        def dfs(u,p):
            nonlocal ans
            tin[u]=low[u]=t[0]; t[0]+=1
            for v in g[u]:
                if v==p: continue
                if tin[v]==-1:
                    dfs(v,u); low[u]=min(low[u], low[v])
                    if low[v]>tin[u]: ans+=1
                else: low[u]=min(low[u], tin[v])
        for i in range(n):
            if tin[i]==-1: dfs(i,-1)
        return ans
    def effort(heights):
        import heapq
        R,C=len(heights),len(heights[0])
        dist=[[10**18]*C for _ in range(R)]; dist[0][0]=0; heap=[(0,0,0)]
        while heap:
            d,r,c=heapq.heappop(heap)
            if d!=dist[r][c]: continue
            if (r,c)==(R-1,C-1): return d
            for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr,nc=r+dr,c+dc
                if 0<=nr<R and 0<=nc<C:
                    nd=max(d, abs(heights[nr][nc]-heights[r][c]))
                    if nd<dist[nr][nc]:
                        dist[nr][nc]=nd; heapq.heappush(heap,(nd,nr,nc))
    def network_time(n, edges):
        parent=list(range(n))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        parts=n
        for a,b,t in sorted(edges, key=lambda e:e[2]):
            ra,rb=find(a),find(b)
            if ra==rb: continue
            parent[ra]=rb; parts-=1
            if parts==1: return t
        return -1
    def last_stone(stones):
        import heapq
        h=[-s for s in stones]; heapq.heapify(h)
        while len(h)>1:
            a=-heapq.heappop(h); b=-heapq.heappop(h)
            if a!=b: heapq.heappush(h,-(a-b))
        return -h[0] if h else 0
    def last_stone2(stones):
        s=sum(stones); target=s//2; dp={0}
        for x in stones: dp|={v+x for v in dp if v+x<=target}
        return s-2*max(dp)
    def predict(nums):
        n=len(nums); dp=[[0]*n for _ in range(n)]
        for i in range(n): dp[i][i]=nums[i]
        for length in range(2,n+1):
            for i in range(n-length+1):
                j=i+length-1
                dp[i][j]=max(nums[i]-dp[i+1][j], nums[j]-dp[i][j-1])
        return dp[0][n-1]>0
    def tickets(days, costs):
        dayset=set(days); last=days[-1]; dp=[0]*(last+1)
        for d in range(1,last+1):
            if d not in dayset: dp[d]=dp[d-1]
            else: dp[d]=min(dp[d-1]+costs[0], dp[max(0,d-7)]+costs[1], dp[max(0,d-30)]+costs[2])
        return dp[last]
    def billboard(rods):
        dp={0:0}
        for r in rods:
            items=list(dp.items())
            for diff,h in items:
                dp[diff+r]=max(dp.get(diff+r,0), h+r)
                dp[diff-r]=max(dp.get(diff-r,0), h)
        return dp[0]
    def min_taps(n, ranges):
        span=[0]*(n+1)
        for i,r in enumerate(ranges):
            left=max(0,i-r); span[left]=max(span[left], min(n,i+r))
        end=far=i=steps=0
        while end<n:
            while i<=end:
                far=max(far, span[i]); i+=1
            if far==end: return -1
            end=far; steps+=1
        return steps
    def max_points(points):
        from collections import defaultdict
        from math import gcd
        best=1
        for i,(x1,y1) in enumerate(points):
            slopes=defaultdict(int)
            for x2,y2 in points[i+1:]:
                dx,dy=x2-x1,y2-y1; g=gcd(dx,dy); slopes[(dx//g,dy//g)]+=1
            if slopes: best=max(best, max(slopes.values())+1)
        return best
    def valid_square(pts):
        def d(a,b): return (a[0]-b[0])**2+(a[1]-b[1])**2
        dists=sorted(d(pts[i],pts[j]) for i in range(4) for j in range(i+1,4))
        return dists[0]>0 and dists[0]==dists[3] and dists[4]==dists[5]
    def rect_area(a,b):
        ax1,ay1,ax2,ay2=a; bx1,by1,bx2,by2=b
        area=(ax2-ax1)*(ay2-ay1)+(bx2-bx1)*(by2-by1)
        w=max(0, min(ax2,bx2)-max(ax1,bx1)); h=max(0, min(ay2,by2)-max(ay1,by1))
        return area-w*h
    def self_cross(dist):
        x=y=0; pts={(0,0)}; dirs=((0,1),(-1,0),(0,-1),(1,0))
        for i,d in enumerate(dist):
            dx,dy=dirs[i%4]
            for _ in range(d):
                x+=dx; y+=dy
                if (x,y) in pts: return True
                pts.add((x,y))
        return False
    def monotone(n):
        s=list(str(n)); mark=len(s)
        for i in range(len(s)-1):
            if s[i]>s[i+1]:
                while i and s[i]==s[i-1]: i-=1
                s[i]=str(int(s[i])-1); mark=i+1; break
        s[mark:]=["9"]*(len(s)-mark)
        return int("".join(s))
    def broken(start, target):
        steps=0
        while target>start:
            target = target+1 if target%2 else target//2
            steps+=1
        return steps+start-target
    def two_keys(n):
        dp=list(range(n+1))
        for i in range(2,n+1):
            for j in range(1,i):
                if i%j==0: dp[i]=min(dp[i], dp[j]+i//j)
        return dp[n]
    def circular(a):
        def kad(xs):
            best=cur=xs[0]
            for x in xs[1:]:
                cur=max(x,cur+x); best=max(best,cur)
            return best
        wrap=sum(a)+kad([-x for x in a])
        return kad(a) if wrap==0 else max(kad(a), wrap)
    add("medium","bay-paren-values","Parenthesized results","parenthesizedResults(expression: string): number","Topic: divide and conquer. Count distinct values from fully parenthesizing an expression of digits and + - *.","parenthesizedResults('2*3-4*5')", paren_ways("2*3-4*5"))
    add("medium","bay-desk-calc","Inline calculator","inlineCalculator(expression: string): number","Topic: stack. + and - are weaker than * and /. Division truncates toward zero. Return the value.","inlineCalculator('3+2*2')", calc2("3+2*2"))
    add("easy","bay-digit-product","Decimal product","decimalProduct(left: string, right: string): string","Topic: math. Return the product of two non-negative decimal strings.","decimalProduct('12', '12')", str(12*12))
    add("medium","bay-version-order","Compare versions","compareVersions(left: string, right: string): number","Topic: strings. Return -1, 0, or 1 comparing dot-separated versions. Missing parts are 0.","compareVersions('1.01', '1.001')", cmp_ver("1.01","1.001"))
    add("easy","bay-shared-prefix","Common prefix","commonPrefix(words: string[]): string","Topic: strings. Return the longest shared prefix, or an empty string.","commonPrefix(['flower', 'flow', 'flight'])", longest_prefix(["flower","flow","flight"]))
    add("medium","bay-zigzag","Zigzag rows","zigzagRows(text: string, rows: number): string","Topic: strings. Write down the rows in a zigzag, then read across.","zigzagRows('PAYPALISHIRING', 3)", zigzag("PAYPALISHIRING",3))
    add("medium","bay-provinces","City provinces","cityProvinces(links: number[][]): number","Topic: graphs. links[i][j] is 1 when cities are connected. Return the province count.","cityProvinces([[1,1,0],[1,1,0],[0,0,1]])", provinces([[1,1,0],[1,1,0],[0,0,1]]))
    add("medium","bay-closed-islands","Interior islands","interiorIslands(grid: number[][]): number","Topic: graphs. 0 is land and 1 is water. Count land islands that do not touch the border.","interiorIslands([[1,1,1,1],[1,0,0,1],[1,1,0,1],[1,1,1,1]])", closed([[1,1,1,1],[1,0,0,1],[1,1,0,1],[1,1,1,1]]))
    add("medium","bay-reorder-roads","Roads toward zero","roadsTowardZero(cities: number, roads: [number, number][]): number","Topic: graphs. Reverse the fewest directed tree edges so every city can reach 0.","roadsTowardZero(6, [[0,1],[1,3],[2,3],[4,0],[4,5]])", min_reorder(6,[[0,1],[1,3],[2,3],[4,0],[4,5]]))
    add("medium","bay-extra-wires","Wires to reconnect","wiresToReconnect(nodes: number, wires: [number, number][]): number","Topic: union-find. Move existing wires to connect every node, or return -1.","wiresToReconnect(4, [[0,1],[0,2],[1,2]])", make_connected(4,[[0,1],[0,2],[1,2]]))
    add("easy","bay-town-judge","Trusted by all","trustedByAll(people: number, trust: [number, number][]): number","Topic: graphs. The judge trusts nobody and is trusted by everyone else. Return that person, or -1.","trustedByAll(3, [[1,3],[2,3]])", find_judge(3,[[1,3],[2,3]]))
    add("hard","bay-critical-links","Bridges in a network","bridgesInNetwork(nodes: number, links: [number, number][]): number","Topic: graphs. Count undirected links whose removal disconnects some pair that was connected.","bridgesInNetwork(4, [[0,1],[1,2],[2,0],[1,3]])", critical(4,[[0,1],[1,2],[2,0],[1,3]]))
    add("medium","bay-path-effort","Least height effort","leastHeightEffort(heights: number[][]): number","Topic: graphs. Effort is the largest absolute step on the path. Return the least effort to the opposite corner.","leastHeightEffort([[1,2,2],[3,8,2],[5,3,5]])", effort([[1,2,2],[3,8,2],[5,3,5]]))
    add("hard","bay-connect-time","Earliest full connection","earliestFullConnection(nodes: number, offers: [number, number, number][]): number","Topic: union-find. offers are [a, b, time]. Return the earliest time all nodes connect, or -1.","earliestFullConnection(4, [[0,1,3],[2,3,4],[0,3,5],[1,2,6]])", network_time(4,[[0,1,3],[2,3,4],[0,3,5],[1,2,6]]))
    add("easy","bay-last-stone","Last stone weight","lastStoneWeight(stones: number[]): number","Topic: heaps. Repeatedly smash the two heaviest. Return what remains, or 0.","lastStoneWeight([2,7,4,1,8,1])", last_stone([2,7,4,1,8,1]))
    add("medium","bay-stone-difference","Closest stone split","closestStoneSplit(stones: number[]): number","Topic: DP. Split into two groups. Return the smallest absolute difference of sums.","closestStoneSplit([2,7,4,1,8,1])", last_stone2([2,7,4,1,8,1]))
    add("medium","bay-predict-score","Ends of the row","endsOfTheRow(values: number[]): boolean","Topic: games. Players take either end. Return whether the first player can force a strictly higher total.","endsOfTheRow([1,5,2])", predict([1,5,2]))
    add("medium","bay-travel-passes","Pass prices","passPrices(days: number[], costs: [number, number, number]): number","Topic: DP. costs are 1-day, 7-day, and 30-day passes. Cover every listed day as cheaply as possible.","passPrices([1,4,6,7,8,20], [2,7,15])", tickets([1,4,6,7,8,20],[2,7,15]))
    add("hard","bay-billboard","Equal support height","equalSupportHeight(rods: number[]): number","Topic: DP. Place each rod left, right, or aside. Return the greatest equal height.","equalSupportHeight([1,2,3,6])", billboard([1,2,3,6]))
    add("hard","bay-tap-range","Fewest taps","fewestTaps(length: number, ranges: number[]): number","Topic: greedy. Tap i covers i-ranges[i] through i+ranges[i] inside 0..length. Return the fewest taps, or -1.","fewestTaps(5, [3,4,1,1,0,0])", min_taps(5,[3,4,1,1,0,0]))
    add("hard","bay-line-points","Collinear points","collinearPoints(points: [number, number][]): number","Topic: geometry. Return how many of the points lie on one line, at most.","collinearPoints([[1,1],[2,2],[3,3]])", max_points([[1,1],[2,2],[3,3]]))
    add("medium","bay-valid-square","Square corners","areSquareCorners(points: [number, number][]): boolean","Topic: geometry. Return whether four points are corners of a positive-area square.","areSquareCorners([[0,0],[1,1],[1,0],[0,1]])", valid_square([[0,0],[1,1],[1,0],[0,1]]))
    add("medium","bay-rect-area","Covered rectangle area","coveredRectangleArea(first: [number, number, number, number], second: [number, number, number, number]): number","Topic: geometry. Each box is bottom-left then top-right. Return the covered area.","coveredRectangleArea([-3,0,3,4], [0,-1,9,2])", rect_area([-3,0,3,4],[0,-1,9,2]))
    add("hard","bay-self-cross","Path crosses itself","pathCrossesItself(steps: number[]): boolean","Topic: geometry. Walk north, west, south, east, repeating. Return whether the path visits a point twice.","pathCrossesItself([2,1,1,2])", self_cross([2,1,1,2]))
    add("medium","bay-monotone-digits","Nondecreasing digits","largestNondecreasing(value: number): number","Topic: greedy. Return the largest integer at most value whose digits never decrease.","largestNondecreasing(332)", monotone(332))
    add("medium","bay-broken-calc","Broken display","brokenDisplay(start: number, target: number): number","Topic: greedy. Double or subtract 1. Return the fewest operations from start to target.","brokenDisplay(2, 3)", broken(2,3))
    add("medium","bay-two-keys","Copy and paste count","copyAndPasteCount(n: number): number","Topic: DP. Start with one character. Copy All then Paste. Return the fewest operations that yield n characters.","copyAndPasteCount(3)", two_keys(3))
    add("medium","bay-circular-slice","Circular slice sum","circularSliceSum(values: number[]): number","Topic: DP. A non-empty slice may wrap once. Return the greatest sum. Do not wrap the entire array as if it were two copies.","circularSliceSum([5,-3,5])", circular([5,-3,5]))
