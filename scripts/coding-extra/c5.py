
def register(add):
    def lis_count(a):
        n=len(a); length=[1]*n; ways=[1]*n; best=1
        for i in range(n):
            for j in range(i):
                if a[j]<a[i]:
                    if length[j]+1>length[i]:
                        length[i]=length[j]+1; ways[i]=ways[j]
                    elif length[j]+1==length[i]: ways[i]+=ways[j]
            best=max(best,length[i])
        return sum(w for w,l in zip(ways,length) if l==best)
    def envelopes(env):
        import bisect
        a=sorted(env, key=lambda e:(e[0], -e[1])); tails=[]
        for _,h in a:
            i=bisect.bisect_left(tails,h)
            if i==len(tails): tails.append(h)
            else: tails[i]=h
        return len(tails)
    def chain(pairs):
        a=sorted(pairs, key=lambda p:p[1]); end=-10**9; n=0
        for s,e in a:
            if s>end: n+=1; end=e
        return n
    def matrix_chain(dims):
        n=len(dims)-1
        dp=[[0]*n for _ in range(n)]
        for length in range(2,n+1):
            for i in range(n-length+1):
                j=i+length-1; dp[i][j]=10**18
                for k in range(i,j):
                    dp[i][j]=min(dp[i][j], dp[i][k]+dp[k+1][j]+dims[i]*dims[k+1]*dims[j+1])
        return dp[0][n-1]
    def eggs(eggs, floors):
        dp=[[0]*(floors+1) for _ in range(eggs+1)]
        for f in range(floors+1): dp[1][f]=f
        for e in range(2,eggs+1):
            for f in range(1,floors+1):
                best=10**9
                lo,hi=1,f
                # linear is fine for small floors
                for x in range(1,f+1):
                    best=min(best, 1+max(dp[e-1][x-1], dp[e][f-x]))
                dp[e][f]=best
        return dp[eggs][floors]
    def burst(nums):
        a=[1]+list(nums)+[1]; n=len(a)
        dp=[[0]*n for _ in range(n)]
        for length in range(2,n):
            for l in range(n-length):
                r=l+length
                for i in range(l+1,r):
                    dp[l][r]=max(dp[l][r], a[l]*a[i]*a[r]+dp[l][i]+dp[i][r])
        return dp[0][n-1]
    def stick(n, cuts):
        a=[0]+sorted(cuts)+[n]; m=len(a)
        dp=[[0]*m for _ in range(m)]
        for length in range(2,m):
            for l in range(m-length):
                r=l+length; dp[l][r]=10**18
                for i in range(l+1,r):
                    dp[l][r]=min(dp[l][r], a[r]-a[l]+dp[l][i]+dp[i][r])
        return dp[0][m-1]
    def dungeon(g):
        R,C=len(g),len(g[0])
        dp=[[10**9]*C for _ in range(R)]
        dp[-1][-1]=max(1,1-g[-1][-1])
        for r in range(R-1,-1,-1):
            for c in range(C-1,-1,-1):
                if (r,c)==(R-1,C-1): continue
                need=min(dp[r+1][c] if r+1<R else 10**9, dp[r][c+1] if c+1<C else 10**9)
                dp[r][c]=max(1, need-g[r][c])
        return dp[0][0]
    def square(g):
        R,C=len(g),len(g[0]); dp=[0]*C; best=prev=0
        for r in range(R):
            prev=0
            for c in range(C):
                tmp=dp[c]
                if g[r][c]=="1":
                    dp[c]=1+min(dp[c], dp[c-1] if c else 0, prev); best=max(best,dp[c])
                else: dp[c]=0
                prev=tmp
        return best*best
    def count_sq(g):
        R,C=len(g),len(g[0]); dp=[[0]*C for _ in range(R)]; total=0
        for r in range(R):
            for c in range(C):
                if g[r][c]:
                    dp[r][c]=1+(min(dp[r-1][c],dp[r][c-1],dp[r-1][c-1]) if r and c else 0)
                    total+=dp[r][c]
        return total
    def knight(n,k,row,col):
        dirs=[(1,2),(1,-2),(-1,2),(-1,-2),(2,1),(2,-1),(-2,1),(-2,-1)]
        dp=[[0]*n for _ in range(n)]; dp[row][col]=1
        for _ in range(k):
            nxt=[[0]*n for _ in range(n)]
            for r in range(n):
                for c in range(n):
                    if not dp[r][c]: continue
                    for dr,dc in dirs:
                        nr,nc=r+dr,c+dc
                        if 0<=nr<n and 0<=nc<n: nxt[nr][nc]+=dp[r][c]/8
            dp=nxt
        return round(sum(sum(row) for row in dp), 5)
    def off(m,n,moves,sr,sc):
        MOD=10**9+7; dp=[[0]*n for _ in range(m)]; dp[sr][sc]=1; ans=0
        dirs=[(1,0),(-1,0),(0,1),(0,-1)]
        for _ in range(moves):
            nxt=[[0]*n for _ in range(m)]
            for r in range(m):
                for c in range(n):
                    if not dp[r][c]: continue
                    for dr,dc in dirs:
                        nr,nc=r+dr,c+dc
                        if not (0<=nr<m and 0<=nc<n): ans=(ans+dp[r][c])%MOD
                        else: nxt[nr][nc]=(nxt[nr][nc]+dp[r][c])%MOD
            dp=nxt
        return ans
    def dice(n,faces,target):
        MOD=10**9+7; dp=[0]*(target+1); dp[0]=1
        for _ in range(n):
            nxt=[0]*(target+1)
            for s,w in enumerate(dp):
                if not w: continue
                for f in range(1,faces+1):
                    if s+f<=target: nxt[s+f]=(nxt[s+f]+w)%MOD
            dp=nxt
        return dp[target]
    def predict(nums):
        n=len(nums); dp=[[0]*n for _ in range(n)]
        for i in range(n-1,-1,-1):
            dp[i][i]=nums[i]
            for j in range(i+1,n):
                dp[i][j]=max(nums[i]-dp[i+1][j], nums[j]-dp[i][j-1])
        return dp[0][n-1]>=0
    def paint(costs):
        a=b=c=0
        for x,y,z in costs:
            a,b,c=x+min(b,c), y+min(a,c), z+min(a,b)
        return min(a,b,c)
    def fence(n,k):
        if n==1: return k
        same,diff=k,k*(k-1)
        for _ in range(3,n+1):
            same,diff=diff,(same+diff)*(k-1)
        return same+diff
    def tickets(days, costs):
        travel=set(days); last=days[-1]; dp=[0]*(last+1)
        for d in range(1,last+1):
            if d not in travel: dp[d]=dp[d-1]
            else: dp[d]=min(dp[max(0,d-1)]+costs[0], dp[max(0,d-7)]+costs[1], dp[max(0,d-30)]+costs[2])
        return dp[last]
    def arith(a):
        cur=total=0
        for i in range(2,len(a)):
            if a[i]-a[i-1]==a[i-1]-a[i-2]:
                cur+=1; total+=cur
            else: cur=0
        return total
    def long_arith(a):
        dp=[dict() for _ in a]; best=1
        for i in range(len(a)):
            for j in range(i):
                d=a[i]-a[j]; length=dp[j].get(d,1)+1
                dp[i][d]=max(dp[i].get(d,0), length); best=max(best,length)
        return best
    def queens(n):
        count=0; cols=set(); d1=set(); d2=set()
        def walk(r):
            nonlocal count
            if r==n:
                count+=1; return
            for c in range(n):
                if c in cols or r-c in d1 or r+c in d2: continue
                cols.add(c); d1.add(r-c); d2.add(r+c); walk(r+1)
                cols.remove(c); d1.remove(r-c); d2.remove(r+c)
        walk(0); return count
    def wildcard(s,p):
        dp=[[False]*(len(p)+1) for _ in range(len(s)+1)]; dp[0][0]=True
        for j in range(1,len(p)+1):
            if p[j-1]=="*": dp[0][j]=dp[0][j-1]
        for i in range(1,len(s)+1):
            for j in range(1,len(p)+1):
                if p[j-1]=="*": dp[i][j]=dp[i][j-1] or dp[i-1][j]
                elif p[j-1] in ("?", s[i-1]): dp[i][j]=dp[i-1][j-1]
        return dp[-1][-1]
    def regex(s,p):
        dp=[[False]*(len(p)+1) for _ in range(len(s)+1)]; dp[0][0]=True
        for j in range(2,len(p)+1):
            if p[j-1]=="*": dp[0][j]=dp[0][j-2]
        for i in range(1,len(s)+1):
            for j in range(1,len(p)+1):
                if p[j-1]=="*":
                    dp[i][j]=dp[i][j-2] or ((p[j-2] in (".", s[i-1])) and dp[i-1][j])
                elif p[j-1] in (".", s[i-1]):
                    dp[i][j]=dp[i-1][j-1]
        return dp[-1][-1]
    def interleave(a,b,c):
        if len(a)+len(b)!=len(c): return False
        dp=[[False]*(len(b)+1) for _ in range(len(a)+1)]; dp[0][0]=True
        for i in range(len(a)+1):
            for j in range(len(b)+1):
                if i and a[i-1]==c[i+j-1]: dp[i][j]|=dp[i-1][j]
                if j and b[j-1]==c[i+j-1]: dp[i][j]|=dp[i][j-1]
        return dp[-1][-1]
    def distinct(s,t):
        dp=[0]*(len(t)+1); dp[0]=1
        for c in s:
            for j in range(len(t),0,-1):
                if c==t[j-1]: dp[j]+=dp[j-1]
        return dp[-1]
    def one_edit(a,b):
        if abs(len(a)-len(b))>1: return False
        i=j=used=0
        while i<len(a) and j<len(b):
            if a[i]==b[j]: i+=1; j+=1; continue
            if used: return False
            used=1
            if len(a)==len(b): i+=1; j+=1
            elif len(a)>len(b): i+=1
            else: j+=1
        return True
    def lcs(a,b):
        dp=[[0]*(len(b)+1) for _ in range(len(a)+1)]
        for i,ca in enumerate(a,1):
            for j,cb in enumerate(b,1):
                dp[i][j]=dp[i-1][j-1]+1 if ca==cb else max(dp[i-1][j], dp[i][j-1])
        return dp[-1][-1]
    def histogram(h):
        h=h+[0]; st=[-1]; best=0
        for i,v in enumerate(h):
            while st[-1]!=-1 and v<h[st[-1]]:
                height=h[st.pop()]; best=max(best, height*(i-st[-1]-1))
            st.append(i)
        return best
    def trap(h):
        l,r=0,len(h)-1; lm=rm=water=0
        while l<r:
            if h[l]<h[r]:
                lm=max(lm,h[l]); water+=lm-h[l]; l+=1
            else:
                rm=max(rm,h[r]); water+=rm-h[r]; r-=1
        return water
    def inversions(a):
        a=a[:]; tmp=[0]*len(a); inv=[0]
        def sort(lo,hi):
            if hi-lo<=1: return
            mid=(lo+hi)//2; sort(lo,mid); sort(mid,hi)
            i,j,k=lo,mid,lo
            while i<mid and j<hi:
                if a[i]<=a[j]: tmp[k]=a[i]; i+=1
                else: tmp[k]=a[j]; j+=1; inv[0]+=mid-i
                k+=1
            tmp[k:hi]=a[i:mid] if j==hi else a[j:hi]
            # fix copy
            while i<mid: tmp[k]=a[i]; i+=1; k+=1
            while j<hi: tmp[k]=a[j]; j+=1; k+=1
            a[lo:hi]=tmp[lo:hi]
        sort(0,len(a)); return inv[0]
    add("hard","rising-chain-count","Rising chain count","risingChainCount(values: number[]): number","Topic: dynamic programming. Count the longest strictly increasing subsequences. Different index lists count separately.","risingChainCount([1, 3, 5, 4, 7])", lis_count([1,3,5,4,7]))
    add("hard","nested-envelopes","Nested envelopes","nestedEnvelopes(envelopes: [number, number][]): number","Topic: dynamic programming. An envelope fits in another only when width and height are both strictly smaller. Return the longest nest.","nestedEnvelopes([[5, 4], [6, 4], [6, 7], [2, 3]])", envelopes([[5,4],[6,4],[6,7],[2,3]]))
    add("medium","pair-chain","Pair chain","pairChain(pairs: [number, number][]): number","Topic: greedy. [c, d] may follow [a, b] only when b < c. Return the longest chain.","pairChain([[1, 2], [2, 3], [3, 4]])", chain([[1,2],[2,3],[3,4]]))
    add("hard","matrix-multiply-cost","Matrix multiply cost","matrixMultiplyCost(dims: number[]): number","Topic: dynamic programming. Matrix i is dims[i] by dims[i+1]. Return the fewest scalar multiplications.","matrixMultiplyCost([10, 20, 30, 40])", matrix_chain([10,20,30,40]))
    add("hard","egg-drops","Egg drops","eggDrops(eggs: number, floors: number): number","Topic: dynamic programming. Return the fewest drops that guarantee finding the critical floor.","eggDrops(2, 6)", eggs(2,6))
    add("hard","crate-burst","Crate burst score","crateBurst(scores: number[]): number","Topic: dynamic programming. Bursting a crate earns the product of its current neighbors. A missing neighbor is 1. Return the best total.","crateBurst([3, 1, 5, 8])", burst([3,1,5,8]))
    add("hard","stick-cuts","Stick cuts","stickCuts(length: number, cuts: number[]): number","Topic: dynamic programming. A cut costs the current piece length. Perform every cut. Return the minimum cost.","stickCuts(7, [1, 3, 4, 5])", stick(7,[1,3,4,5]))
    add("hard","dungeon-health","Dungeon health","dungeonHealth(grid: number[][]): number","Topic: dynamic programming. Move only right or down. Health stays at least 1 before every cell. Return the minimum start.","dungeonHealth([[-2, -3, 3], [-5, -10, 1], [10, 30, -5]])", dungeon([[-2,-3,3],[-5,-10,1],[10,30,-5]]))
    add("medium","largest-square","Largest square","largestSquare(grid: string[][]): number","Topic: dynamic programming. Cells are '1' or '0'. Return the area of the largest square of ones.","largestSquare([['1','0','1','0','0'],['1','0','1','1','1'],['1','1','1','1','1'],['1','0','0','1','0']])", square([["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]))
    add("medium","count-squares","Count the squares","countSquares(grid: number[][]): number","Topic: dynamic programming. Count squares of ones, including 1 by 1 cells.","countSquares([[0,1,1,1],[1,1,1,1],[0,1,1,1]])", count_sq([[0,1,1,1],[1,1,1,1],[0,1,1,1]]))
    add("medium","knight-stay","Knight stays on the board","knightStay(n: number, moves: number, row: number, col: number): number","Topic: dynamic programming. Return the probability, rounded to 5 decimals in the example, that a knight is still on the board.","knightStay(3, 2, 0, 0)", knight(3,2,0,0))
    add("hard","walk-off-grid","Walk off the grid","walkOffGrid(rows: number, cols: number, moves: number, startRow: number, startCol: number): number","Topic: dynamic programming. Count ways to step off the grid within the move budget, modulo 1000000007.","walkOffGrid(2, 2, 2, 0, 0)", off(2,2,2,0,0))
    add("medium","dice-target","Dice target","diceTarget(dice: number, faces: number, target: number): number","Topic: dynamic programming. Faces are 1 through faces. Count ways to reach target, modulo 1000000007.","diceTarget(2, 6, 7)", dice(2,6,7))
    add("medium","optimal-picks","Optimal picks","firstCanForce(piles: number[]): boolean","Topic: games. Take from either end. Both play optimally. Return whether the starter can tie or win the sum.","firstCanForce([1, 5, 2])", predict([1,5,2]))
    add("medium","stone-piles","Stone piles","firstWinsPiles(piles: number[]): boolean","Topic: games. Same end-taking game. Return whether the first player gets at least half the total when both play optimally.","firstWinsPiles([5, 3, 4, 5])", predict([5,3,4,5]))
    add("medium","paint-costs","Paint costs","paintCosts(costs: number[][]): number","Topic: dynamic programming. Each house has red, blue, and green costs. Neighbors differ. Return the cheapest plan.","paintCosts([[17,2,17],[16,16,5],[14,3,19]])", paint([[17,2,17],[16,16,5],[14,3,19]]))
    add("medium","fence-colors","Fence colors","fenceColors(posts: number, colors: number): number","Topic: dynamic programming. At most two adjacent posts share a color. Count the paintings.","fenceColors(3, 2)", fence(3,2))
    add("medium","travel-passes","Travel passes","travelPasses(days: number[], costs: [number, number, number]): number","Topic: dynamic programming. Passes last 1, 7, or 30 days. Cover every travel day as cheaply as possible.","travelPasses([1,4,6,7,8,20], [2,7,15])", tickets([1,4,6,7,8,20],[2,7,15]))
    add("medium","arithmetic-slices","Arithmetic slices","arithmeticSlices(values: number[]): number","Topic: dynamic programming. Count contiguous arithmetic runs of at least three values.","arithmeticSlices([1,2,3,4])", arith([1,2,3,4]))
    add("medium","longest-arithmetic","Longest arithmetic subsequence","longestArithmetic(values: number[]): number","Topic: dynamic programming. Return the longest arithmetic subsequence length.","longestArithmetic([3,6,9,12])", long_arith([3,6,9,12]))
    add("hard","quiet-board-count","Quiet board count","quietBoardCount(n: number): number","Topic: backtracking. Count placements of n queens with no shared row, column, or diagonal.","quietBoardCount(4)", queens(4))
    add("hard","wildcard-match","Wildcard match","wildcardMatch(text: string, pattern: string): boolean","Topic: dynamic programming. '?' is one character and '*' is any sequence. Match the whole text.","wildcardMatch('adceb', '*a*b')", wildcard("adceb","*a*b"))
    add("hard","token-pattern","Token pattern","tokenPattern(text: string, pattern: string): boolean","Topic: dynamic programming. '.' is one character and '*' repeats the previous token. Match the whole text.","tokenPattern('aab', 'c*a*b')", regex("aab","c*a*b"))
    add("medium","can-interleave","Can interleave","canInterleave(a: string, b: string, woven: string): boolean","Topic: dynamic programming. Return whether woven keeps the order of both strings.","canInterleave('aab', 'axy', 'aaxaby')", interleave("aab","axy","aaxaby"))
    add("hard","subseq-ways","Subsequence ways","subseqWays(source: string, target: string): number","Topic: dynamic programming. Count subsequences of source equal to target.","subseqWays('rabbbit', 'rabbit')", distinct("rabbbit","rabbit"))
    add("medium","one-edit-away","One edit away","oneEditAway(a: string, b: string): boolean","Topic: strings. Return whether one insert, delete, or replace turns a into b.","oneEditAway('pale', 'ple')", one_edit("pale","ple"))
    add("medium","delete-distance","Delete distance","deleteDistance(a: string, b: string): number","Topic: dynamic programming. Return the fewest deletions that make the strings equal.","deleteDistance('sea', 'eat')", len("sea")+len("eat")-2*lcs("sea","eat"))
    add("hard","shortest-superseq","Shortest common supersequence length","shortestSuperLength(a: string, b: string): number","Topic: dynamic programming. Return the length of the shortest common supersequence.","shortestSuperLength('abac', 'cab')", len("abac")+len("cab")-lcs("abac","cab"))
    add("hard","histogram-area","Histogram area","histogramArea(heights: number[]): number","Topic: stack. Bars have width 1. Return the largest rectangle.","histogramArea([2,1,5,6,2,3])", histogram([2,1,5,6,2,3]))
    add("hard","caught-rain","Caught rain","caughtRain(heights: number[]): number","Topic: two pointers. Water rises to the lower bounding bar. Return the units held.","caughtRain([0,1,0,2,1,0,1,3,2,1,2,1])", trap([0,1,0,2,1,0,1,3,2,1,2,1]))
    add("hard","inversion-count","Inversion count","inversionCount(values: number[]): number","Topic: divide and conquer. Count pairs i < j with a larger value first.","inversionCount([2,4,1,3,5])", inversions([2,4,1,3,5]))
