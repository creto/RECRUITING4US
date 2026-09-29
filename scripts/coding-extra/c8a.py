
def register(add):
    def fib(n):
        a,b=0,1
        for _ in range(n): a,b=b,a+b
        return a
    def trib(n):
        a,b,c=0,1,1
        if n==0: return 0
        if n<3: return 1
        for _ in range(3,n+1): a,b,c=b,c,a+b+c
        return c
    def min_cost_climb(cost):
        a=b=0
        for x in cost:
            a,b=b,x+min(a,b)
        return min(a,b)
    def rob_circle(a):
        def rob(xs):
            p=c=0
            for x in xs:
                p,c=c,max(c,p+x)
            return c
        if len(a)==1: return a[0]
        return max(rob(a[:-1]), rob(a[1:]))
    def delete_earn(a):
        from collections import Counter
        c=Counter(a); lo,hi=min(c),max(c)
        prev=cur=0
        for x in range(lo,hi+1):
            prev,cur=cur,max(cur, prev+x*c[x])
        return cur
    def int_break(n):
        dp=[0]*(n+1)
        for i in range(2,n+1):
            for j in range(1,i):
                dp[i]=max(dp[i], max(j,dp[j])*max(i-j,dp[i-j]))
        return dp[n]
    def perfect_sq(n):
        dp=[0]+[10**9]*n
        for i in range(1,n+1):
            s=1
            while s*s<=i:
                dp[i]=min(dp[i], dp[i-s*s]+1); s+=1
        return dp[n]
    def lis_count(a):
        n=len(a); leng=[1]*n; cnt=[1]*n
        for i in range(n):
            for j in range(i):
                if a[j]<a[i]:
                    if leng[j]+1>leng[i]:
                        leng[i]=leng[j]+1; cnt[i]=cnt[j]
                    elif leng[j]+1==leng[i]:
                        cnt[i]+=cnt[j]
        best=max(leng)
        return sum(c for L,c in zip(leng,cnt) if L==best)
    def envelopes(envs):
        import bisect
        envs=sorted(envs, key=lambda e:(e[0], -e[1]))
        tails=[]
        for _,h in envs:
            i=bisect.bisect_left(tails,h)
            if i==len(tails): tails.append(h)
            else: tails[i]=h
        return len(tails)
    def pair_chain(pairs):
        pairs=sorted(pairs, key=lambda p:p[1]); end=-10**18; count=0
        for a,b in pairs:
            if a>end: count+=1; end=b
        return count
    def stitch(clips, time):
        clips=sorted(clips); reach=end=i=steps=0
        while end<time:
            while i<len(clips) and clips[i][0]<=end:
                reach=max(reach, clips[i][1]); i+=1
            if reach==end: return -1
            end=reach; steps+=1
        return steps
    def jump3(arr, start):
        seen=[False]*len(arr); stack=[start]
        while stack:
            i=stack.pop()
            if i<0 or i>=len(arr) or seen[i]: continue
            seen[i]=True
            if arr[i]==0: return True
            stack.append(i+arr[i]); stack.append(i-arr[i])
        return False
    def split_sum(nums, m):
        lo,hi=max(nums),sum(nums)
        def ok(cap):
            parts=1; run=0
            for x in nums:
                if run+x>cap: parts+=1; run=0
                run+=x
            return parts<=m
        while lo<hi:
            mid=(lo+hi)//2
            if ok(mid): hi=mid
            else: lo=mid+1
        return lo
    def ship(weights, days):
        lo,hi=max(weights),sum(weights)
        def ok(cap):
            d=1; run=0
            for w in weights:
                if run+w>cap: d+=1; run=0
                run+=w
            return d<=days
        while lo<hi:
            mid=(lo+hi)//2
            if ok(mid): hi=mid
            else: lo=mid+1
        return lo
    def koko(piles, hours):
        lo,hi=1,max(piles)
        while lo<hi:
            mid=(lo+hi)//2
            if sum((p+mid-1)//mid for p in piles)<=hours: hi=mid
            else: lo=mid+1
        return lo
    def median2(a,b):
        A,B=sorted((a,b), key=len); m,n=len(A),len(B); lo,hi=0,m; half=(m+n+1)//2
        while lo<=hi:
            i=(lo+hi)//2; j=half-i
            if i<m and j>0 and B[j-1]>A[i]: lo=i+1
            elif i>0 and j<n and A[i-1]>B[j]: hi=i-1
            else:
                left=B[j-1] if i==0 else A[i-1] if j==0 else max(A[i-1],B[j-1])
                if (m+n)%2: return left
                right=B[j] if i==m else A[i] if j==n else min(A[i],B[j])
                return (left+right)/2
    def find_peak(a):
        lo,hi=0,len(a)-1
        while lo<hi:
            mid=(lo+hi)//2
            if a[mid]<a[mid+1]: lo=mid+1
            else: hi=mid
        return lo
    def min_rotated(a):
        lo,hi=0,len(a)-1
        while lo<hi:
            mid=(lo+hi)//2
            if a[mid]>a[hi]: lo=mid+1
            else: hi=mid
        return a[lo]
    def search_matrix(grid, target):
        R,C=len(grid),len(grid[0]); lo,hi=0,R*C-1
        while lo<=hi:
            mid=(lo+hi)//2; v=grid[mid//C][mid%C]
            if v==target: return True
            if v<target: lo=mid+1
            else: hi=mid-1
        return False
    def next_perm(a):
        b=a[:]; i=len(b)-2
        while i>=0 and b[i]>=b[i+1]: i-=1
        if i>=0:
            j=len(b)-1
            while b[j]<=b[i]: j-=1
            b[i],b[j]=b[j],b[i]
        b[i+1:]=reversed(b[i+1:]); return b
    def nCk(n,k):
        dp=[[0]*(k+1) for _ in range(n+1)]
        for i in range(n+1):
            dp[i][0]=1
            for j in range(1,min(i,k)+1): dp[i][j]=dp[i-1][j-1]+dp[i-1][j]
        return dp[n][k]
    def paths_obs(grid):
        C=len(grid[0]); dp=[0]*C; dp[0]=0 if grid[0][0] else 1
        for r,row in enumerate(grid):
            for c,v in enumerate(row):
                if v: dp[c]=0
                elif c: dp[c]+=dp[c-1]
        return dp[-1]
    def dungeon(grid):
        R,C=len(grid),len(grid[0]); dp=[[10**18]*C for _ in range(R)]
        dp[-1][-1]=max(1,1-grid[-1][-1])
        for r in range(R-1,-1,-1):
            for c in range(C-1,-1,-1):
                if r==R-1 and c==C-1: continue
                need=10**18
                if r+1<R: need=min(need, dp[r+1][c])
                if c+1<C: need=min(need, dp[r][c+1])
                dp[r][c]=max(1, need-grid[r][c])
        return dp[0][0]
    def falling(grid):
        dp=grid[0][:]
        for row in grid[1:]:
            nxt=[]
            for c,v in enumerate(row):
                best=dp[c]
                if c: best=min(best, dp[c-1])
                if c+1<len(dp): best=min(best, dp[c+1])
                nxt.append(best+v)
            dp=nxt
        return min(dp)
    add("easy","bay-fib","Dock fibonacci","dockFibonacci(n: number): number","Topic: DP. Return the nth Fibonacci number with F(0) = 0 and F(1) = 1.","dockFibonacci(7)", fib(7))
    add("easy","bay-trib","Triple step total","tripleStep(n: number): number","Topic: DP. T(0) = 0, T(1) = 1, T(2) = 1, and each later term is the sum of the previous three. Return T(n).","tripleStep(5)", trib(5))
    add("easy","bay-climb-cost","Cheapest climb","cheapestClimb(cost: number[]): number","Topic: DP. cost[i] is paid when you step on stair i. From a stair you may climb one or two stairs. You may start at stair 0 or 1. You finish after passing the last stair. Return the cheapest cost.","cheapestClimb([10, 15, 20])", min_cost_climb([10,15,20]))
    add("medium","bay-circle-loot","Circular night route","circularNightRoute(houses: number[]): number","Topic: DP. Houses stand in a circle, so the first and last are adjacent. You cannot take adjacent houses. Return the greatest sum.","circularNightRoute([2, 3, 2])", rob_circle([2,3,2]))
    add("medium","bay-delete-earn","Delete and earn","deleteAndEarn(values: number[]): number","Topic: DP. Taking a value earns every copy of it and deletes every copy of the neighbors value-1 and value+1. Return the greatest total.","deleteAndEarn([3, 4, 2])", delete_earn([3,4,2]))
    add("medium","bay-integer-break","Integer break product","integerBreakProduct(n: number): number","Topic: DP. Split n into at least two positive integers. Return the greatest product.","integerBreakProduct(10)", int_break(10))
    add("medium","bay-square-sum","Fewest squares","fewestSquares(n: number): number","Topic: DP. Return the fewest perfect squares that add to n.","fewestSquares(12)", perfect_sq(12))
    add("hard","bay-rising-count","Count of longest rises","countLongestRises(values: number[]): number","Topic: DP. Count strictly increasing subsequences whose length equals the longest such subsequence.","countLongestRises([1, 3, 5, 4, 7])", lis_count([1,3,5,4,7]))
    add("hard","bay-envelopes","Nested envelopes","nestedEnvelopes(envelopes: [number, number][]): number","Topic: DP. One envelope fits in another only when both width and height are strictly smaller. Return the longest nesting.","nestedEnvelopes([[5, 4], [6, 4], [6, 7], [2, 3]])", envelopes([[5,4],[6,4],[6,7],[2,3]]))
    add("medium","bay-pair-chain","Chained pairs","chainedPairs(pairs: [number, number][]): number","Topic: greedy. Pair (a, b) may follow a pair that ends strictly before a. Return the longest chain.","chainedPairs([[1, 2], [2, 3], [3, 4]])", pair_chain([[1,2],[2,3],[3,4]]))
    add("medium","bay-clip-stitch","Video clip cover","videoClipCover(clips: [number, number][], time: number): number","Topic: greedy. Cover time 0 through time with the fewest clips. Return that count, or -1.","videoClipCover([[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], 10)", stitch([[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]],10))
    add("medium","bay-jump-zero","Reach a zero cell","reachZeroCell(values: number[], start: number): boolean","Topic: graphs. From i you jump exactly values[i] left or right inside the array. Return whether a 0 is reachable.","reachZeroCell([4, 2, 3, 0, 3, 1, 2], 5)", jump3([4,2,3,0,3,1,2],5))
    add("hard","bay-split-largest","Fairest split sum","fairestSplitSum(values: number[], parts: number): number","Topic: binary search. Split into parts non-empty contiguous parts. Minimize the largest part sum.","fairestSplitSum([7, 2, 5, 10, 8], 2)", split_sum([7,2,5,10,8],2))
    add("medium","bay-ship-capacity","Least ship capacity","leastShipCapacity(weights: number[], days: number): number","Topic: binary search. Packages ship in order. One sailing per day. Return the least capacity that finishes in days.","leastShipCapacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)", ship([1,2,3,4,5,6,7,8,9,10],5))
    add("medium","bay-eating-speed","Crate eating speed","crateEatingSpeed(piles: number[], hours: number): number","Topic: binary search. Each hour you finish k crates from one pile, or the rest of that pile. Return the smallest k that finishes within hours.","crateEatingSpeed([3, 6, 7, 11], 8)", koko([3,6,7,11],8))
    add("hard","bay-two-medians","Combined median","combinedMedian(left: number[], right: number[]): number","Topic: binary search. Both inputs are sorted. Return the median. Average the two middle values when the count is even.","combinedMedian([1, 3], [2])", median2([1,3],[2]))
    add("medium","bay-peak-index","A peak index","aPeakIndex(values: number[]): number","Topic: binary search. The sequence rises and then falls, or is strictly monotone. Return an index greater than its existing neighbors.","aPeakIndex([1, 2, 3, 1])", find_peak([1,2,3,1]))
    add("medium","bay-rotated-min","Rotated minimum","rotatedMinimum(values: number[]): number","Topic: binary search. A sorted unique list was rotated. Return the minimum.","rotatedMinimum([3, 4, 5, 1, 2])", min_rotated([3,4,5,1,2]))
    add("medium","bay-flat-search","Flattened grid search","flattenedGridSearch(grid: number[][], target: number): boolean","Topic: binary search. Rows are sorted and each row starts above the previous row's end. Return whether target occurs.","flattenedGridSearch([[1, 3, 5], [7, 9, 11]], 9)", search_matrix([[1,3,5],[7,9,11]],9))
    add("medium","bay-next-order","Next permutation","nextPermutation(values: number[]): number[]","Topic: arrays. Return the next permutation in lexicographical order, or the first if this is the last.","nextPermutation([1, 2, 3])", next_perm([1,2,3]))
    add("easy","bay-choose","Ways to choose","waysToChoose(n: number, k: number): number","Topic: DP. Return how many ways to choose k items from n distinct items.","waysToChoose(5, 2)", nCk(5,2))
    add("medium","bay-blocked-routes","Routes around blocks","routesAroundBlocks(grid: number[][]): number","Topic: DP. 1 is blocked. Move only right or down from the top-left. Return how many ways reach the bottom-right.","routesAroundBlocks([[0, 0, 0], [0, 1, 0], [0, 0, 0]])", paths_obs([[0,0,0],[0,1,0],[0,0,0]]))
    add("hard","bay-dungeon","Starting health","startingHealth(grid: number[][]): number","Topic: DP. Health changes by the room value and must stay at least 1. Move only right or down. Return the least starting health.","startingHealth([[-2, -3, 3], [-5, -10, 1], [10, 30, -5]])", dungeon([[-2,-3,3],[-5,-10,1],[10,30,-5]]))
    add("medium","bay-falling-path","Cheapest falling path","cheapestFallingPath(grid: number[][]): number","Topic: DP. Step straight down or diagonally down. Return the cheapest top-to-bottom path.","cheapestFallingPath([[2, 1, 3], [6, 5, 4], [7, 8, 9]])", falling([[2,1,3],[6,5,4],[7,8,9]]))
