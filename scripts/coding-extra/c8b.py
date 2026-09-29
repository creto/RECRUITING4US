
def register(add):
    MOD=10**9+7
    def out_bound(m,n,maxMove,sr,sc):
        dp=[[0]*n for _ in range(m)]; dp[sr][sc]=1; ans=0
        for _ in range(maxMove):
            nxt=[[0]*n for _ in range(m)]
            for r in range(m):
                for c in range(n):
                    if not dp[r][c]: continue
                    for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                        nr,nc=r+dr,c+dc
                        if nr<0 or nc<0 or nr>=m or nc>=n: ans=(ans+dp[r][c])%MOD
                        else: nxt[nr][nc]=(nxt[nr][nc]+dp[r][c])%MOD
            dp=nxt
        return ans
    def knight_dial(n):
        moves={0:(4,6),1:(6,8),2:(7,9),3:(4,8),4:(0,3,9),5:(),6:(0,1,7),7:(2,6),8:(1,3),9:(2,4)}
        dp=[1]*10
        for _ in range(n-1):
            nxt=[0]*10
            for a,vs in moves.items():
                for b in vs: nxt[b]=(nxt[b]+dp[a])%MOD
            dp=nxt
        return sum(dp)%MOD
    def dice(n, faces, target):
        dp=[0]*(target+1); dp[0]=1
        for _ in range(n):
            nxt=[0]*(target+1)
            for s in range(target+1):
                if not dp[s]: continue
                for f in range(1,faces+1):
                    if s+f<=target: nxt[s+f]=(nxt[s+f]+dp[s])%MOD
            dp=nxt
        return dp[target]
    def vowel_perm(n):
        dp=[1]*5
        for _ in range(n-1):
            a,e,i,o,u=dp
            dp=[(e+i+u)%MOD,(a+i)%MOD,(e+o)%MOD,i%MOD,(i+o)%MOD]
        return sum(dp)%MOD
    def nCk(n,k):
        r=1
        for i in range(k): r=r*(n-i)//(i+1)
        return r
    def new21(n,k,maxPts):
        if k-1+maxPts<n: return 0.0
        dp=[0.0]*(k+maxPts); dp[0]=1; window=0
        for i in range(1,k+maxPts):
            if i-1<k: window+=dp[i-1]
            if i-maxPts-1>=0: window-=dp[i-maxPts-1]
            dp[i]=window/maxPts
        return sum(dp[n:])
    def egg(k,n):
        dp=list(range(n+1))
        for _ in range(2,k+1):
            nxt=[0]*(n+1); x=1
            for f in range(1,n+1):
                while x<f and max(dp[x-1], nxt[f-x])>max(dp[x], nxt[f-x-1]):
                    x+=1
                nxt[f]=1+max(dp[x-1], nxt[f-x])
            dp=nxt
        return dp[n]
    def stick_cut(n, cuts):
        pts=[0]+sorted(cuts)+[n]; m=len(pts)
        dp=[[0]*m for _ in range(m)]
        for length in range(2,m):
            for i in range(m-length):
                j=i+length
                dp[i][j]=min(dp[i][k]+dp[k][j] for k in range(i+1,j))+pts[j]-pts[i]
        return dp[0][m-1]
    def balloons(nums):
        a=[1]+nums+[1]; m=len(a); dp=[[0]*m for _ in range(m)]
        for length in range(2,m):
            for i in range(m-length):
                j=i+length
                for k in range(i+1,j):
                    dp[i][j]=max(dp[i][j], a[i]*a[k]*a[j]+dp[i][k]+dp[k][j])
        return dp[0][m-1]
    def strange(s):
        n=len(s); dp=[[0]*n for _ in range(n)]
        for i in range(n): dp[i][i]=1
        for length in range(2,n+1):
            for i in range(n-length+1):
                j=i+length-1; dp[i][j]=dp[i][j-1]+1
                for k in range(i,j):
                    if s[k]==s[j]:
                        mid=dp[k+1][j-1] if k+1<=j-1 else 0
                        dp[i][j]=min(dp[i][j], dp[i][k]+mid)
        return dp[0][n-1]
    def distinct_sub(s,t):
        dp=[0]*(len(t)+1); dp[0]=1
        for ch in s:
            for j in range(len(t),0,-1):
                if ch==t[j-1]: dp[j]+=dp[j-1]
        return dp[-1]
    def interleave(a,b,c):
        if len(a)+len(b)!=len(c): return False
        dp=[False]*(len(b)+1); dp[0]=True
        for j in range(1,len(b)+1): dp[j]=dp[j-1] and b[j-1]==c[j-1]
        for i in range(1,len(a)+1):
            dp[0]=dp[0] and a[i-1]==c[i-1]
            for j in range(1,len(b)+1):
                dp[j]=(dp[j] and a[i-1]==c[i+j-1]) or (dp[j-1] and b[j-1]==c[i+j-1])
        return dp[-1]
    def is_match(s,p):
        m,n=len(s),len(p); dp=[[False]*(n+1) for _ in range(m+1)]; dp[0][0]=True
        for j in range(2,n+1):
            if p[j-1]=="*": dp[0][j]=dp[0][j-2]
        for i in range(1,m+1):
            for j in range(1,n+1):
                if p[j-1]=="*":
                    dp[i][j]=dp[i][j-2] or (dp[i-1][j] and p[j-2] in (s[i-1],"."))
                elif p[j-1] in (s[i-1],"."):
                    dp[i][j]=dp[i-1][j-1]
        return dp[m][n]
    def wild(s,p):
        m,n=len(s),len(p); dp=[[False]*(n+1) for _ in range(m+1)]; dp[0][0]=True
        for j in range(1,n+1):
            if p[j-1]=="*": dp[0][j]=dp[0][j-1]
        for i in range(1,m+1):
            for j in range(1,n+1):
                if p[j-1]=="*": dp[i][j]=dp[i][j-1] or dp[i-1][j]
                elif p[j-1] in (s[i-1],"?"): dp[i][j]=dp[i-1][j-1]
        return dp[m][n]
    def maximal_rect(matrix):
        C=len(matrix[0]); heights=[0]*C; best=0
        for row in matrix:
            for c,ch in enumerate(row): heights[c]=heights[c]+1 if ch=="1" else 0
            st=[-1]; h=heights+[0]
            for i,x in enumerate(h):
                while st[-1]!=-1 and h[st[-1]]>x:
                    height=h[st.pop()]; best=max(best, height*(i-st[-1]-1))
                st.append(i)
        return best
    def first_missing(a):
        n=len(a); b=a[:]
        for i in range(n):
            while 1<=b[i]<=n and b[b[i]-1]!=b[i]:
                j=b[i]-1; b[i],b[j]=b[j],b[i]
        for i,x in enumerate(b):
            if x!=i+1: return i+1
        return n+1
    def queens(n):
        cols=set(); d1=set(); d2=set()
        def dfs(r):
            if r==n: return 1
            count=0
            for c in range(n):
                if c in cols or r-c in d1 or r+c in d2: continue
                cols.add(c); d1.add(r-c); d2.add(r+c)
                count+=dfs(r+1)
                cols.remove(c); d1.remove(r-c); d2.remove(r+c)
            return count
        return dfs(0)
    def ip_count(s):
        n=len(s); count=0
        def ok(part):
            return part and not (len(part)>1 and part[0]=="0") and int(part)<=255
        for a in range(1,min(4,n)):
            for b in range(1,min(4,n-a)):
                for c in range(1,min(4,n-a-b)):
                    d=n-a-b-c
                    if 1<=d<=3 and all(ok(p) for p in (s[:a],s[a:a+b],s[a+b:a+b+c],s[a+b+c:])):
                        count+=1
        return count
    def ops_count(num, target):
        n=len(num)
        def dfs(i, prev, total):
            if i==n: return int(total==target)
            count=val=0
            for j in range(i,n):
                if j>i and num[i]=="0": break
                val=val*10+int(num[j])
                if i==0: count+=dfs(j+1, val, val)
                else:
                    count+=dfs(j+1, val, total+val)
                    count+=dfs(j+1, -val, total-val)
                    count+=dfs(j+1, prev*val, total-prev+prev*val)
            return count
        return dfs(0,0,0)
    add("hard","bay-leave-grid","Walks that leave","walksThatLeave(rows: number, cols: number, moves: number, startRow: number, startCol: number): number","Topic: DP. Each step moves to an edge neighbor. Count walks of exactly moves steps that stay inside until the last step, which leaves the grid. Modulo 1000000007.","walksThatLeave(2, 2, 2, 0, 0)", out_bound(2,2,2,0,0))
    add("medium","bay-knight-dials","Phone knight hops","phoneKnightHops(hops: number): number","Topic: DP. A knight starts on any digit and makes hops-1 jumps on a phone pad. Return how many sequences of that length exist, modulo 1000000007.","phoneKnightHops(1)", knight_dial(1))
    add("medium","bay-dice-target","Dice sum ways","diceSumWays(diceCount: number, faces: number, target: number): number","Topic: DP. Faces are 1 through faces. Return ways to sum to target, modulo 1000000007.","diceSumWays(2, 6, 7)", dice(2,6,7))
    add("hard","bay-vowel-strings","Vowel chain count","vowelChainCount(length: number): number","Topic: DP. Follow a to e, e to a or i, i to a e o or u, o to i or u, and u to a. Count strings of that length, modulo 1000000007.","vowelChainCount(2)", vowel_perm(2))
    add("easy","bay-sorted-vowels","Nondecreasing vowels","nondecreasingVowels(length: number): number","Topic: combinatorics. Count length strings from a e i o u that are sorted nondecreasing.","nondecreasingVowels(2)", nCk(2+4,4))
    add("hard","bay-card-points","Draw until stop","drawUntilStop(stop: number, maxDraw: number, goal: number): number","Topic: DP. Draw a uniform integer from 1 through maxDraw while the total is below stop. Return the probability of finishing at or above goal, rounded to 5 decimals in the example.","drawUntilStop(10, 1, 10)", round(new21(10,1,10),5))
    add("hard","bay-egg-drops","Guaranteed egg drops","guaranteedEggDrops(eggs: number, floors: number): number","Topic: DP. Return the fewest drops that guarantee finding the highest safe floor among floors, with the given eggs.","guaranteedEggDrops(2, 6)", egg(2,6))
    add("hard","bay-stick-cuts","Cut cost of a stick","cutCostOfStick(length: number, cuts: number[]): number","Topic: DP. Cutting a current piece costs its length. Return the least cost of performing every cut.","cutCostOfStick(7, [1, 3, 4, 5])", stick_cut(7,[1,3,4,5]))
    add("hard","bay-balloon-score","Burst score","burstScore(values: number[]): number","Topic: DP. Bursting a balloon scores its value times the nearest balloons still standing. Outside ends are 1. Return the best score.","burstScore([3, 1, 5, 8])", balloons([3,1,5,8]))
    add("hard","bay-printer-turns","Repeated print turns","repeatedPrintTurns(text: string): number","Topic: DP. One turn prints the same character any positive number of times. Return the fewest turns.","repeatedPrintTurns('aaabbb')", strange("aaabbb"))
    add("hard","bay-subseq-ways","Target subsequence count","targetSubsequenceCount(text: string, target: string): number","Topic: DP. Count subsequences of text equal to target.","targetSubsequenceCount('rabbbit', 'rabbit')", distinct_sub("rabbbit","rabbit"))
    add("medium","bay-interleave","Order-preserving mix","orderPreservingMix(left: string, right: string, goal: string): boolean","Topic: DP. Return whether goal mixes left and right while keeping each string's order.","orderPreservingMix('aab', 'axy', 'aaxaby')", interleave("aab","axy","aaxaby"))
    add("hard","bay-pattern-match","Dot and star match","dotStarMatch(text: string, pattern: string): boolean","Topic: DP. A dot matches one character. A star matches zero or more of the character before it. Match the whole text.","dotStarMatch('aab', 'c*a*b')", is_match("aab","c*a*b"))
    add("hard","bay-wild-match","Star wildcard","starWildcard(text: string, pattern: string): boolean","Topic: DP. Question mark matches one character. Star matches any run, including empty. Match the whole text.","starWildcard('adceb', '*a*b')", wild("adceb","*a*b"))
    add("hard","bay-max-rectangle","Rectangle of ones","rectangleOfOnes(grid: string[][]): number","Topic: stack. Return the area of the largest solid rectangle of the character 1.","rectangleOfOnes([['1','0','1','0','0'],['1','0','1','1','1'],['1','1','1','1','1'],['1','0','0','1','0']])", maximal_rect([["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]))
    add("hard","bay-first-missing","Smallest missing positive","smallestMissingPositive(values: number[]): number","Topic: arrays. Return the smallest positive integer that does not occur.","smallestMissingPositive([3, 4, -1, 1])", first_missing([3,4,-1,1]))
    add("hard","bay-quiet-queens","Non-attacking queens","nonAttackingQueens(n: number): number","Topic: backtracking. Count ways to place n queens on an n by n board with no shared row, column, or diagonal.","nonAttackingQueens(4)", queens(4))
    add("medium","bay-address-count","Dotted address count","dottedAddressCount(digits: string): number","Topic: backtracking. Count splits into four parts, each an integer 0 through 255 with no leading zero.","dottedAddressCount('25525511135')", ip_count("25525511135"))
    add("hard","bay-operator-count","Inserted operator count","insertedOperatorCount(digits: string, target: number): number","Topic: backtracking. Place +, -, or * between digits, or join them. Count expressions equal to target. Joined numbers cannot have a leading zero.","insertedOperatorCount('123', 6)", ops_count("123",6))
