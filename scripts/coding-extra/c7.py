
def register(add):
    def rev_words(s):
        return " ".join(s.split()[::-1])
    def valid_paren(s):
        m={')':'(',']':'[','}':'{'}; st=[]
        for c in s:
            if c in "([{": st.append(c)
            elif not st or st.pop()!=m.get(c): return False
        return not st
    def missing(a):
        n=len(a); return n*(n+1)//2 - sum(a)
    def single(a):
        x=0
        for v in a: x^=v
        return x
    def hamming(n):
        return bin(n).count("1")
    def pow2(n):
        return n>0 and n&(n-1)==0
    def move0(a):
        b=[x for x in a if x]; return b+[0]*(len(a)-len(b))
    def plus1(a):
        b=a[:]; i=len(b)-1
        while i>=0 and b[i]==9:
            b[i]=0; i-=1
        if i<0: return [1]+b
        b[i]+=1; return b
    def last_word(s):
        parts=s.split(); return len(parts[-1]) if parts else 0
    def majority(a):
        c=None; n=0
        for v in a:
            if n==0: c=v; n=1
            elif v==c: n+=1
            else: n-=1
        return c
    def has_dup(a):
        return len(a)!=len(set(a))
    def inter(a,b):
        return sorted(set(a)&set(b))
    def happy(n):
        seen=set()
        while n!=1 and n not in seen:
            seen.add(n); n=sum(int(d)**2 for d in str(n))
        return n==1
    def iso(a,b):
        if len(a)!=len(b): return False
        ab={}; ba={}
        for x,y in zip(a,b):
            if ab.get(x,y)!=y or ba.get(y,x)!=x: return False
            ab[x]=y; ba[y]=x
        return True
    def ransom(note, mag):
        from collections import Counter
        c=Counter(mag)
        for ch in note:
            if c[ch]==0: return False
            c[ch]-=1
        return True
    def anag(a,b):
        return sorted(a)==sorted(b)
    def first_once(s):
        from collections import Counter
        c=Counter(s)
        for i,ch in enumerate(s):
            if c[ch]==1: return i
        return -1
    def pal_num(n):
        s=str(n); return n>=0 and s==s[::-1]
    def floor_sqrt(n):
        lo,hi=0,n
        while lo<hi:
            mid=(lo+hi+1)//2
            if mid*mid<=n: lo=mid
            else: hi=mid-1
        return lo
    def col_num(s):
        n=0
        for c in s: n=n*26+ord(c)-64
        return n
    def add_bin(a,b):
        return bin(int(a,2)+int(b,2))[2:]
    def alnum_pal(s):
        t="".join(c.lower() for c in s if c.isalnum())
        return t==t[::-1]
    def index_of(hay, needle):
        return hay.find(needle)
    def count_primes(n):
        if n<3: return 0
        sieve=[True]*n; sieve[0]=sieve[1]=False
        p=2
        while p*p<n:
            if sieve[p]:
                for i in range(p*p,n,p): sieve[i]=False
            p+=1
        return sum(sieve)
    def trail(n):
        z=0
        while n:
            n//=5; z+=n
        return z
    def pascal(k):
        row=[1]
        for _ in range(k):
            row=[1]+[row[i]+row[i+1] for i in range(len(row)-1)]+[1]
        return row
    def dedupe(a):
        if not a: return 0
        w=1
        for i in range(1,len(a)):
            if a[i]!=a[w-1]:
                a[w]=a[i]; w+=1
        return w
    def merge_sorted(a,b):
        i=j=0; out=[]
        while i<len(a) and j<len(b):
            if a[i]<=b[j]: out.append(a[i]); i+=1
            else: out.append(b[j]); j+=1
        return out+a[i:]+b[j:]
    def stock1(p):
        best=0; low=10**18
        for x in p:
            low=min(low,x); best=max(best, x-low)
        return best
    def kadane(a):
        best=cur=a[0]
        for x in a[1:]:
            cur=max(x, cur+x); best=max(best, cur)
        return best
    def rob(a):
        prev=cur=0
        for x in a:
            prev,cur=cur, max(cur, prev+x)
        return cur
    def stairs(n):
        a=b=1
        for _ in range(n): a,b=b,a+b
        return a
    def gas(g,c):
        if sum(g)<sum(c): return -1
        tank=start=0
        for i,(x,y) in enumerate(zip(g,c)):
            tank+=x-y
            if tank<0: start=i+1; tank=0
        return start
    def jump(a):
        reach=0
        for i,x in enumerate(a):
            if i>reach: return False
            reach=max(reach, i+x)
        return True
    def jump2(a):
        end=far=steps=0
        for i in range(len(a)-1):
            far=max(far, i+a[i])
            if i==end:
                steps+=1; end=far
        return steps
    def eq_part(a):
        s=sum(a)
        if s%2: return False
        target=s//2; dp={0}
        for x in a:
            dp |= {v+x for v in dp if v+x<=target}
        return target in dp
    def word_break(s, words):
        w=set(words); dp=[False]*(len(s)+1); dp[0]=True
        for i in range(len(s)):
            if not dp[i]: continue
            for j in range(i+1,len(s)+1):
                if s[i:j] in w: dp[j]=True
        return dp[-1]
    def coin_ways(coins, amount):
        dp=[0]*(amount+1); dp[0]=1
        for c in coins:
            for x in range(c, amount+1): dp[x]+=dp[x-c]
        return dp[amount]
    def coin_min(coins, amount):
        dp=[10**9]*(amount+1); dp[0]=0
        for x in range(1, amount+1):
            for c in coins:
                if c<=x: dp[x]=min(dp[x], dp[x-c]+1)
        return -1 if dp[amount]>=10**9 else dp[amount]
    def lis(a):
        import bisect
        tails=[]
        for x in a:
            i=bisect.bisect_left(tails, x)
            if i==len(tails): tails.append(x)
            else: tails[i]=x
        return len(tails)
    def edit(a,b):
        m,n=len(a),len(b)
        dp=list(range(n+1))
        for i,ca in enumerate(a,1):
            prev=dp[0]; dp[0]=i
            for j,cb in enumerate(b,1):
                cur=dp[j]
                dp[j]=prev if ca==cb else 1+min(prev, dp[j], dp[j-1])
                prev=cur
        return dp[n]
    def unique_paths(m,n):
        dp=[1]*n
        for _ in range(1,m):
            for j in range(1,n): dp[j]+=dp[j-1]
        return dp[-1]
    def min_path(grid):
        R,C=len(grid),len(grid[0])
        dp=[[0]*C for _ in range(R)]
        dp[0][0]=grid[0][0]
        for c in range(1,C): dp[0][c]=dp[0][c-1]+grid[0][c]
        for r in range(1,R):
            dp[r][0]=dp[r-1][0]+grid[r][0]
            for c in range(1,C):
                dp[r][c]=grid[r][c]+min(dp[r-1][c], dp[r][c-1])
        return dp[-1][-1]
    def triangle(rows):
        dp=rows[-1][:]
        for r in range(len(rows)-2,-1,-1):
            for c in range(len(rows[r])):
                dp[c]=rows[r][c]+min(dp[c], dp[c+1])
        return dp[0]
    def pal_count(s):
        n=len(s); count=0
        dp=[[False]*n for _ in range(n)]
        for i in range(n-1,-1,-1):
            for j in range(i,n):
                if s[i]==s[j] and (j-i<2 or dp[i+1][j-1]):
                    dp[i][j]=True; count+=1
        return count
    def longest_pal_len(s):
        n=len(s); best=0
        for i in range(n):
            for a,b in ((i,i),(i,i+1)):
                while a>=0 and b<n and s[a]==s[b]:
                    best=max(best, b-a+1); a-=1; b+=1
        return best
    def rotate(m):
        n=len(m); a=[row[:] for row in m]
        return [[a[n-1-c][r] for c in range(n)] for r in range(n)]
    def zero_matrix(m):
        a=[row[:] for row in m]; R,C=len(a),len(a[0])
        rows={r for r in range(R) for c in range(C) if a[r][c]==0}
        cols={c for r in range(R) for c in range(C) if a[r][c]==0}
        for r in rows:
            for c in range(C): a[r][c]=0
        for c in cols:
            for r in range(R): a[r][c]=0
        return a
    def course(n, pre):
        from collections import defaultdict, deque
        g=defaultdict(list); deg=[0]*n
        for a,b in pre:
            g[b].append(a); deg[a]+=1
        q=deque(i for i in range(n) if deg[i]==0)
        seen=0
        while q:
            u=q.popleft(); seen+=1
            for v in g[u]:
                deg[v]-=1
                if deg[v]==0: q.append(v)
        return seen==n
    def redundant(n, edges):
        parent=list(range(n+1))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        for a,b in edges:
            ra,rb=find(a),find(b)
            if ra==rb: return [a,b]
            parent[ra]=rb
        return []
    def delay(n, times, k):
        import heapq
        from collections import defaultdict
        g=defaultdict(list)
        for u,v,w in times: g[u].append((v,w))
        dist=[10**18]*(n+1); dist[k]=0; heap=[(0,k)]
        while heap:
            d,u=heapq.heappop(heap)
            if d!=dist[u]: continue
            for v,w in g[u]:
                if d+w<dist[v]:
                    dist[v]=d+w; heapq.heappush(heap,(dist[v],v))
        ans=max(dist[1:]); return -1 if ans>=10**18 else ans
    def cheap(n, flights, src, dst, k):
        dist=[10**18]*n; dist[src]=0
        for _ in range(k+1):
            nxt=dist[:]
            for u,v,w in flights:
                if dist[u]<10**18 and dist[u]+w<nxt[v]:
                    nxt[v]=dist[u]+w
            dist=nxt
        return -1 if dist[dst]>=10**18 else dist[dst]
    def ladder_len(begin, end, words):
        from collections import deque
        bank=set(words)
        if end not in bank: return 0
        q=deque([(begin,1)])
        while q:
            w,d=q.popleft()
            if w==end: return d
            for i in range(len(w)):
                for ch in "abcdefghijklmnopqrstuvwxyz":
                    nxt=w[:i]+ch+w[i+1:]
                    if nxt in bank:
                        bank.remove(nxt); q.append((nxt,d+1))
        return 0
    def rpn(tokens):
        st=[]
        for t in tokens:
            if t in "+-*/":
                b=st.pop(); a=st.pop()
                if t=="+": st.append(a+b)
                elif t=="-": st.append(a-b)
                elif t=="*": st.append(a*b)
                else: st.append(int(a/b))
            else: st.append(int(t))
        return st[-1]
    def simplify(path):
        st=[]
        for part in path.split("/"):
            if part in ("", "."): continue
            if part=="..":
                if st: st.pop()
            else: st.append(part)
        return "/"+"/".join(st)
    def decode_str(s):
        st=[]; num=0; cur=""
        for c in s:
            if c.isdigit(): num=num*10+int(c)
            elif c=="[":
                st.append((cur,num)); cur=""; num=0
            elif c=="]":
                prev,k=st.pop(); cur=prev+cur*k
            else: cur+=c
        return cur
    def letter_count(digits):
        if not digits: return 0
        m={"2":"abc","3":"def","4":"ghi","5":"jkl","6":"mno","7":"pqrs","8":"tuv","9":"wxyz"}
        n=1
        for d in digits: n*=len(m[d])
        return n
    def paren_count(n):
        dp=[0]*(n+1); dp[0]=1
        for i in range(1,n+1):
            dp[i]=sum(dp[j]*dp[i-1-j] for j in range(i))
        return dp[n]
    def subset_count(a):
        return 2**len(a)
    def perm_count(a):
        from math import factorial
        return factorial(len(a))
    def comb_sum_count(cands, target):
        dp=[0]*(target+1); dp[0]=1
        for c in cands:
            for x in range(c, target+1): dp[x]+=dp[x-c]
        return dp[target]
    def target_sum(nums, target):
        s=sum(nums)
        if (s+target)%2 or abs(target)>s: return 0
        need=(s+target)//2
        dp=[0]*(need+1); dp[0]=1
        for x in nums:
            for v in range(need, x-1, -1): dp[v]+=dp[v-x]
        return dp[need]
    def knap(weights, values, cap):
        dp=[0]*(cap+1)
        for w,v in zip(weights, values):
            for c in range(cap, w-1, -1):
                dp[c]=max(dp[c], dp[c-w]+v)
        return dp[cap]
    def lcs(a,b):
        dp=[[0]*(len(b)+1) for _ in range(len(a)+1)]
        for i,ca in enumerate(a,1):
            for j,cb in enumerate(b,1):
                dp[i][j]=dp[i-1][j-1]+1 if ca==cb else max(dp[i-1][j], dp[i][j-1])
        return dp[-1][-1]
    def lcsub(a,b):
        best=0; prev=[0]*(len(b)+1)
        for ca in a:
            cur=[0]*(len(b)+1)
            for j,cb in enumerate(b,1):
                if ca==cb:
                    cur[j]=prev[j-1]+1; best=max(best, cur[j])
            prev=cur
        return best
    def min_del_pal(s):
        return len(s)-lcs(s, s[::-1])
    def pal_cuts(s):
        n=len(s); pal=[[False]*n for _ in range(n)]
        for i in range(n-1,-1,-1):
            for j in range(i,n):
                pal[i][j]=s[i]==s[j] and (j-i<2 or pal[i+1][j-1])
        dp=[0]*n
        for i in range(n):
            if pal[0][i]: dp[i]=0
            else:
                dp[i]=min(dp[j]+1 for j in range(i) if pal[j+1][i])
        return dp[-1]
    def max_square(grid):
        if not grid: return 0
        R,C=len(grid),len(grid[0]); best=0
        dp=[[0]*C for _ in range(R)]
        for r in range(R):
            for c in range(C):
                if grid[r][c]=="1":
                    dp[r][c]=1 if r==0 or c==0 else 1+min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1])
                    best=max(best, dp[r][c])
        return best*best
    def hist(heights):
        st=[-1]; best=0; h=heights+[0]
        for i,x in enumerate(h):
            while st[-1]!=-1 and h[st[-1]]>x:
                height=h[st.pop()]
                best=max(best, height*(i-st[-1]-1))
            st.append(i)
        return best
    def trap(h):
        l,r=0,len(h)-1; left=right=water=0
        while l<r:
            if h[l]<=h[r]:
                left=max(left, h[l]); water+=left-h[l]; l+=1
            else:
                right=max(right, h[r]); water+=right-h[r]; r-=1
        return water
    def container(h):
        l,r=0,len(h)-1; best=0
        while l<r:
            best=max(best, min(h[l], h[r])*(r-l))
            if h[l]<h[r]: l+=1
            else: r-=1
        return best
    def daily(t):
        st=[]; out=[0]*len(t)
        for i,x in enumerate(t):
            while st and t[st[-1]]<x:
                j=st.pop(); out[j]=i-j
            st.append(i)
        return out
    def asteroids(a):
        st=[]
        for x in a:
            while st and st[-1]>0 and x<0:
                if st[-1]<-x: st.pop(); continue
                if st[-1]==-x: st.pop()
                break
            else:
                st.append(x)
        return st
    def remove_dup_letters(s):
        from collections import Counter
        last=Counter(s); st=[]; seen=set()
        for c in s:
            last[c]-=1
            if c in seen: continue
            while st and st[-1]>c and last[st[-1]]:
                seen.remove(st.pop())
            st.append(c); seen.add(c)
        return "".join(st)
    def window_max(a, k):
        from collections import deque
        q=deque(); out=[]
        for i,x in enumerate(a):
            while q and a[q[-1]]<=x: q.pop()
            q.append(i)
            if q[0]<=i-k: q.popleft()
            if i>=k-1: out.append(a[q[0]])
        return out
    def anagram_starts(s, p):
        from collections import Counter
        need=Counter(p); have=Counter(); out=[]; m=len(p)
        for i,c in enumerate(s):
            have[c]+=1
            if i>=m:
                left=s[i-m]; have[left]-=1
                if have[left]==0: del have[left]
            if i>=m-1 and have==need: out.append(i-m+1)
        return out
    def replace_run(s, k):
        from collections import Counter
        have=Counter(); i=best=0
        for j,c in enumerate(s):
            have[c]+=1
            while j-i+1-max(have.values())>k:
                have[s[i]]-=1; i+=1
            best=max(best, j-i+1)
        return best
    def min_sub(a, target):
        i=total=0; best=10**9
        for j,x in enumerate(a):
            total+=x
            while total>=target:
                best=min(best, j-i+1); total-=a[i]; i+=1
        return 0 if best>=10**9 else best
    def sub_k(a, k):
        from collections import Counter
        seen=Counter({0:1}); run=count=0
        for x in a:
            run+=x; count+=seen[run-k]; seen[run]+=1
        return count
    def bounded(a, left, right):
        def at_most(bound):
            if bound<0: return 0
            i=total=count=0
            for j,x in enumerate(a):
                total+=x
                while total>bound:
                    total-=a[i]; i+=1
                count+=j-i+1
            return count
        return at_most(right)-at_most(left-1)
    def components(n, edges):
        parent=list(range(n))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        for a,b in edges:
            parent[find(a)]=find(b)
        return len({find(i) for i in range(n)})
    def mst(n, edges):
        parent=list(range(n))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        cost=used=0
        for w,a,b in sorted(edges):
            ra,rb=find(a),find(b)
            if ra==rb: continue
            parent[ra]=rb; cost+=w; used+=1
        return cost if used==n-1 else -1
    def dijkstra(n, edges, src):
        import heapq
        from collections import defaultdict
        g=defaultdict(list)
        for u,v,w in edges: g[u].append((v,w))
        dist=[10**18]*n; dist[src]=0; heap=[(0,src)]
        while heap:
            d,u=heapq.heappop(heap)
            if d!=dist[u]: continue
            for v,w in g[u]:
                if d+w<dist[v]:
                    dist[v]=d+w; heapq.heappush(heap,(dist[v],v))
        return [-1 if x>=10**18 else x for x in dist]
    def topo(n, edges):
        from collections import defaultdict, deque
        g=defaultdict(list); deg=[0]*n
        for a,b in edges:
            g[a].append(b); deg[b]+=1
        q=deque(i for i in range(n) if deg[i]==0)
        out=[]
        while q:
            u=q.popleft(); out.append(u)
            for v in g[u]:
                deg[v]-=1
                if deg[v]==0: q.append(v)
        return out if len(out)==n else []
    def bipartite(n, edges):
        from collections import defaultdict, deque
        g=defaultdict(list)
        for a,b in edges:
            g[a].append(b); g[b].append(a)
        color=[-1]*n
        for s in range(n):
            if color[s]!=-1: continue
            color[s]=0; q=deque([s])
            while q:
                u=q.popleft()
                for v in g[u]:
                    if color[v]==-1:
                        color[v]=1-color[u]; q.append(v)
                    elif color[v]==color[u]: return False
        return True
    def diameter(n, edges):
        from collections import defaultdict
        g=defaultdict(list)
        for a,b in edges:
            g[a].append(b); g[b].append(a)
        def far(start):
            seen={start}; stack=[(start,0)]; best=(0,start)
            while stack:
                u,d=stack.pop()
                if d>best[0]: best=(d,u)
                for v in g[u]:
                    if v not in seen:
                        seen.add(v); stack.append((v,d+1))
            return best
        return far(far(0)[1])[0]
    def kth_bst(root_inorder, k):
        return sorted(root_inorder)[k-1]
    def three_sum_count(a):
        b=sorted(a); n=len(b); count=0
        for i in range(n):
            if i and b[i]==b[i-1]: continue
            l,r=i+1,n-1
            while l<r:
                s=b[i]+b[l]+b[r]
                if s==0:
                    count+=1; l+=1; r-=1
                    while l<r and b[l]==b[l-1]: l+=1
                    while l<r and b[r]==b[r+1]: r-=1
                elif s<0: l+=1
                else: r-=1
        return count
    def max_product(a):
        best=hi=lo=a[0]
        for x in a[1:]:
            vals=(x, hi*x, lo*x)
            hi,lo=max(vals), min(vals)
            best=max(best, hi)
        return best
    def rotate_right_count(a, k):
        if not a: return []
        k%=len(a)
        return a[-k:]+a[:-k] if k else a[:]
    def spiral_order(m):
        if not m: return []
        top,bot,left,right=0,len(m)-1,0,len(m[0])-1
        out=[]
        while top<=bot and left<=right:
            for c in range(left, right+1): out.append(m[top][c])
            top+=1
            for r in range(top, bot+1): out.append(m[r][right])
            right-=1
            if top<=bot:
                for c in range(right, left-1, -1): out.append(m[bot][c])
                bot-=1
            if left<=right:
                for r in range(bot, top-1, -1): out.append(m[r][left])
                left+=1
        return out
    def set_mismatch(a):
        seen=set(); dup=miss=0
        for x in a:
            if x in seen: dup=x
            seen.add(x)
        for i in range(1,len(a)+1):
            if i not in seen: miss=i
        return [dup, miss]
    def find_disappeared(a):
        b=a[:]
        for x in b:
            i=abs(x)-1
            if b[i]>0: b[i]=-b[i]
        return [i+1 for i,v in enumerate(b) if v>0]
    def h_index(cites):
        c=sorted(cites, reverse=True)
        h=0
        for i,v in enumerate(c,1):
            if v>=i: h=i
        return h
    def can_complete(tasks, cooldown):
        from collections import Counter
        if not tasks: return 0
        counts=Counter(tasks)
        most=max(counts.values())
        extra=sum(1 for v in counts.values() if v==most)
        return max(len(tasks), (most-1)*(cooldown+1)+extra)
    def partition_labels(s):
        last={c:i for i,c in enumerate(s)}
        out=[]; start=end=0
        for i,c in enumerate(s):
            end=max(end, last[c])
            if i==end:
                out.append(end-start+1); start=i+1
        return out
    def least_interval_already():
        return 0
    def merge_accounts_count(accounts):
        parent={}
        def find(x):
            parent.setdefault(x,x)
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        def union(a,b):
            parent[find(a)]=find(b)
        for acc in accounts:
            for email in acc[1:]:
                union(acc[1], email)
        return len({find(acc[1]) for acc in accounts if len(acc)>1})
    def num_islands(grid):
        R,C=len(grid),len(grid[0]); seen=[[False]*C for _ in range(R)]
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C or seen[r][c] or grid[r][c]!="1": return
            seen[r][c]=True
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        n=0
        for r in range(R):
            for c in range(C):
                if grid[r][c]=="1" and not seen[r][c]:
                    dfs(r,c); n+=1
        return n
    def max_area(grid):
        R,C=len(grid),len(grid[0]); seen=[[False]*C for _ in range(R)]
        def dfs(r,c):
            if r<0 or c<0 or r>=R or c>=C or seen[r][c] or not grid[r][c]: return 0
            seen[r][c]=True
            return 1+dfs(r+1,c)+dfs(r-1,c)+dfs(r,c+1)+dfs(r,c-1)
        return max((dfs(r,c) for r in range(R) for c in range(C)), default=0)
    def oranges(grid):
        from collections import deque
        R,C=len(grid),len(grid[0]); q=deque(); fresh=0
        for r in range(R):
            for c in range(C):
                if grid[r][c]==2: q.append((r,c,0))
                elif grid[r][c]==1: fresh+=1
        time=0
        while q:
            r,c,t=q.popleft(); time=t
            for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr,nc=r+dr,c+dc
                if 0<=nr<R and 0<=nc<C and grid[nr][nc]==1:
                    grid[nr][nc]=2; fresh-=1; q.append((nr,nc,t+1))
        return time if fresh==0 else -1
    def walls(grid):
        # grid 0 empty, 1 wall, start [0,0] end bottom right. return steps or -1
        if grid[0][0]==1: return -1
        from collections import deque
        R,C=len(grid),len(grid[0])
        q=deque([(0,0,1)]); seen={(0,0)}
        while q:
            r,c,d=q.popleft()
            if r==R-1 and c==C-1: return d
            for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr,nc=r+dr,c+dc
                if 0<=nr<R and 0<=nc<C and grid[nr][nc]==0 and (nr,nc) not in seen:
                    seen.add((nr,nc)); q.append((nr,nc,d+1))
        return -1
    add("easy","reverse-brief","Reverse a brief","reverseBrief(text: string): string","Topic: strings. Split the brief on whitespace, drop empty pieces, and return the words in reverse order joined by a single space.","reverseBrief('  the dock is clear  ')", rev_words("  the dock is clear  "))
    add("easy","brace-balance","Brace balance","bracesBalanced(text: string): boolean","Topic: stack. The text uses round, square, and curly braces. Return whether every opener has a matching closer in order. Other characters do not appear.","bracesBalanced('([{}])')", valid_paren("([{}])"))
    add("easy","missing-badge","Missing badge number","missingBadge(numbers: number[]): number","Topic: math. numbers holds every integer from 0 through n exactly once, except one missing value. Return the missing value.","missingBadge([3, 0, 1])", missing([3,0,1]))
    add("easy","lone-sensor","Lone sensor","loneSensor(readings: number[]): number","Topic: bits. Every reading appears twice except one. Return the reading that appears once.","loneSensor([4, 1, 2, 1, 2])", single([4,1,2,1,2]))
    add("easy","set-bit-count","Set bit count","setBitCount(value: number): number","Topic: bits. Return how many bits are 1 in the binary form of a non-negative integer.","setBitCount(11)", hamming(11))
    add("easy","power-of-two-check","Power of two","isPowerOfTwo(value: number): boolean","Topic: bits. Return whether a positive integer is a power of two. Zero and negatives are not.","isPowerOfTwo(16)", pow2(16))
    add("easy","shift-zeros","Shift zeros","shiftZeros(values: number[]): number[]","Topic: arrays. Move every zero to the end. Keep the order of the other values.","shiftZeros([0, 1, 0, 3, 12])", move0([0,1,0,3,12]))
    add("easy","increment-digits","Increment digits","incrementDigits(digits: number[]): number[]","Topic: arrays. digits is a non-negative integer without leading zeros, one digit per cell, unless the number is zero. Return the digits of that number plus one.","incrementDigits([1, 2, 9])", plus1([1,2,9]))
    add("easy","last-token-length","Last token length","lastTokenLength(text: string): number","Topic: strings. Return the length of the last whitespace-separated token. An empty or blank string returns 0.","lastTokenLength('yard gate open')", last_word("yard gate open"))
    add("easy","majority-shift","Majority shift","majorityShift(ids: number[]): number","Topic: voting. One id appears more than half the time. Return it.","majorityShift([2, 2, 1, 1, 1, 2, 2])", majority([2,2,1,1,1,2,2]))
    add("easy","duplicate-scan","Duplicate scan","hasDuplicate(ids: number[]): boolean","Topic: hashing. Return whether any id appears more than once.","hasDuplicate([1, 2, 3, 1])", has_dup([1,2,3,1]))
    add("easy","shared-skus","Shared SKUs","sharedSkus(left: number[], right: number[]): number[]","Topic: sets. Return the values that appear in both lists, each once, sorted ascending.","sharedSkus([1, 2, 2, 1], [2, 2])", inter([1,2,2,1],[2,2]))
    add("easy","calm-meter","Calm meter","reachesOne(start: number): boolean","Topic: math. Replace a positive integer by the sum of the squares of its digits. Return whether you reach 1.","reachesOne(19)", happy(19))
    add("easy","same-pattern","Same pattern","samePattern(left: string, right: string): boolean","Topic: hashing. Return whether the two strings follow the same character pattern. A character maps to exactly one character in the other string.","samePattern('paper', 'title')", iso("paper","title"))
    add("easy","note-from-scrap","Note from scrap","canBuildNote(note: string, scrap: string): boolean","Topic: counting. Return whether scrap has at least as many of each letter as note. Case matters. Spaces are letters too if present.","canBuildNote('aa', 'aab')", ransom("aa","aab"))
    add("easy","same-letters","Same letters","sameLetters(left: string, right: string): boolean","Topic: counting. Return whether the strings use the same letters with the same counts.","sameLetters('anagram', 'nagaram')", anag("anagram","nagaram"))
    add("easy","first-solo-index","First solo index","firstSoloIndex(text: string): number","Topic: counting. Return the index of the first character that appears once. Return -1 if every character repeats.","firstSoloIndex('stress')", first_once("stress"))
    add("easy","mirror-number","Mirror number","isMirrorNumber(value: number): boolean","Topic: math. Return whether the decimal form reads the same forward and backward. Negative values are not mirrors.","isMirrorNumber(121)", pal_num(121))
    add("easy","floor-root","Floor root","floorRoot(value: number): number","Topic: binary search. Return the greatest integer whose square is at most value. value is non-negative.","floorRoot(8)", floor_sqrt(8))
    add("easy","sheet-column","Sheet column number","sheetColumn(label: string): number","Topic: math. Column labels use A as 1, Z as 26, and AA as 27. Return the number for an uppercase label.","sheetColumn('ZY')", col_num("ZY"))
    add("easy","binary-sum","Binary sum","binarySum(left: string, right: string): string","Topic: math. Both strings are binary numerals without a leading zero unless the value is zero. Return their sum as a binary string.","binarySum('1010', '1011')", add_bin("1010","1011"))
    add("easy","phrase-mirror","Phrase mirror","isPhraseMirror(text: string): boolean","Topic: strings. Ignore case and characters that are not letters or digits. Return whether the rest reads the same forward and backward.","isPhraseMirror('A man, a plan, a canal: Panama')", alnum_pal("A man, a plan, a canal: Panama"))
    add("easy","needle-index","Needle index","needleIndex(haystack: string, needle: string): number","Topic: strings. Return the first index of needle in haystack, or -1. An empty needle returns 0.","needleIndex('sadbutsad', 'sad')", index_of("sadbutsad","sad"))
    add("medium","prime-count","Prime count","primeCount(limit: number): number","Topic: math. Return how many primes are strictly less than limit.","primeCount(10)", count_primes(10))
    add("easy","trailing-zeros","Trailing zeros","trailingZeros(n: number): number","Topic: math. Return how many trailing zeros n! has in decimal. n is non-negative. Do not compute the factorial.","trailingZeros(25)", trail(25))
    add("easy","pascal-row","Pascal row","pascalRow(index: number): number[]","Topic: DP. Return row index of Pascal's triangle, counting from 0. Each inner value is the sum of the two values above it.","pascalRow(3)", pascal(3))
    add("easy","compact-sorted","Compact a sorted list","compactSorted(values: number[]): number","Topic: two pointers. values is sorted. Pack unique values at the front, keeping order. Return how many unique values were packed. You may overwrite the input.","compactSorted([1, 1, 2])", dedupe([1,1,2]))
    add("easy","merge-two-sorted","Merge two sorted lists","mergeSorted(left: number[], right: number[]): number[]","Topic: two pointers. Both lists are sorted ascending. Return one sorted list.","mergeSorted([1, 3, 5], [2, 4])", merge_sorted([1,3,5],[2,4]))
    add("easy","one-sale","One sale","oneSale(prices: number[]): number","Topic: arrays. prices[i] is the price on day i. You may buy once and sell once later. Return the greatest profit, or 0 if no sale helps.","oneSale([7, 1, 5, 3, 6, 4])", stock1([7,1,5,3,6,4]))
    add("easy","best-slice-sum","Best slice sum","bestSliceSum(values: number[]): number","Topic: DP. Return the greatest sum of a non-empty contiguous slice.","bestSliceSum([-2, 1, -3, 4, -1, 2, 1, -5, 4])", kadane([-2,1,-3,4,-1,2,1,-5,4]))
    add("medium","night-shift-loot","Night shift loot","nightShiftLoot(houses: number[]): number","Topic: DP. You cannot take two adjacent houses. Return the greatest sum you can take.","nightShiftLoot([2, 7, 9, 3, 1])", rob([2,7,9,3,1]))
    add("easy","stair-count","Stair count","stairCount(steps: number): number","Topic: DP. You climb 1 or 2 steps at a time. Return how many ways you can climb exactly steps stairs. Order matters.","stairCount(3)", stairs(3))
    add("medium","gas-circuit","Gas circuit","gasCircuit(gas: number[], cost: number[]): number","Topic: greedy. Stations sit on a circle. gas[i] is fuel gained and cost[i] is fuel to reach the next station. Return the starting index that completes the circuit, or -1. If one start works, it is unique.","gasCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2])", gas([1,2,3,4,5],[3,4,5,1,2]))
    add("easy","can-reach-end","Can reach the end","canReachEnd(jumps: number[]): boolean","Topic: greedy. From index i you may jump 1 through jumps[i] steps forward. Return whether index 0 can reach the last index.","canReachEnd([2, 3, 1, 1, 4])", jump([2,3,1,1,4]))
    add("medium","fewest-jumps","Fewest jumps","fewestJumps(jumps: number[]): number","Topic: greedy. From index i you may jump 1 through jumps[i] steps. Return the fewest jumps from the first index to the last. A path exists.","fewestJumps([2, 3, 1, 1, 4])", jump2([2,3,1,1,4]))
    add("medium","equal-halves","Equal halves","canSplitEven(values: number[]): boolean","Topic: DP. Return whether the values can be split into two groups with the same sum.","canSplitEven([1, 5, 11, 5])", eq_part([1,5,11,5]))
    add("medium","dictionary-break","Dictionary break","canBreak(text: string, words: string[]): boolean","Topic: DP. Return whether text can be segmented into a sequence of dictionary words. Words may repeat.","canBreak('recruiting', ['re', 'cruit', 'ing', 'recruit'])", word_break("recruiting",["re","cruit","ing","recruit"]))
    add("medium","coin-orderings","Coin orderings","coinOrderings(coins: number[], amount: number): number","Topic: DP. Count the ways to make amount using unlimited coins. Order does not matter.","coinOrderings([1, 2, 5], 5)", coin_ways([1,2,5],5))
    add("medium","fewest-coins-amount","Fewest coins for an amount","fewestForAmount(coins: number[], amount: number): number","Topic: DP. Coins may be reused. Return the fewest coins that sum to amount, or -1.","fewestForAmount([1, 2, 5], 11)", coin_min([1,2,5],11))
    add("medium","rising-run","Longest rising run","longestRising(values: number[]): number","Topic: DP. Return the length of the longest strictly increasing subsequence. It need not be contiguous.","longestRising([10, 9, 2, 5, 3, 7, 101, 18])", lis([10,9,2,5,3,7,101,18]))
    add("hard","edit-cost","Edit cost","editCost(left: string, right: string): number","Topic: DP. An edit inserts, deletes, or replaces one character. Return the fewest edits that turn left into right.","editCost('horse', 'ros')", edit("horse","ros"))
    add("easy","grid-routes","Grid routes","gridRoutes(rows: number, cols: number): number","Topic: DP. You may only move right or down. Return how many routes go from the top-left to the bottom-right of a rows by cols grid.","gridRoutes(3, 7)", unique_paths(3,7))
    add("medium","cheapest-grid","Cheapest grid path","cheapestGrid(grid: number[][]): number","Topic: DP. Move only right or down. Each cell adds its cost, including the start. Return the cheapest path to the bottom-right.","cheapestGrid([[1, 3, 1], [1, 5, 1], [4, 2, 1]])", min_path([[1,3,1],[1,5,1],[4,2,1]]))
    add("medium","triangle-cost","Triangle path cost","triangleCost(rows: number[][]): number","Topic: DP. From a cell you may step to either adjacent cell in the next row. Return the cheapest path from the top to the bottom.","triangleCost([[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]])", triangle([[2],[3,4],[6,5,7],[4,1,8,3]]))
    add("medium","palindrome-slices","Palindrome slices","palindromeSlices(text: string): number","Topic: DP. Count contiguous slices that read the same forward and backward. Single letters count.","palindromeSlices('aaa')", pal_count("aaa"))
    add("medium","longest-mirror-slice","Longest mirror slice","longestMirrorSlice(text: string): number","Topic: strings. Return the length of the longest contiguous slice that reads the same forward and backward.","longestMirrorSlice('babad')", longest_pal_len("babad"))
    add("medium","quarter-turn","Quarter turn","quarterTurn(matrix: number[][]): number[][]","Topic: arrays. Return the matrix rotated 90 degrees clockwise. Do not change the input.","quarterTurn([[1, 2, 3], [4, 5, 6], [7, 8, 9]])", rotate([[1,2,3],[4,5,6],[7,8,9]]))
    add("medium","clear-lines","Clear lines","clearLines(matrix: number[][]): number[][]","Topic: arrays. If a cell is 0, set its whole row and column to 0. Apply that from the original zeros only. Return the new matrix.","clearLines([[1, 1, 1], [1, 0, 1], [1, 1, 1]])", zero_matrix([[1,1,1],[1,0,1],[1,1,1]]))
    add("medium","course-order-possible","Course order possible","canFinishCourses(count: number, prerequisites: [number, number][]): boolean","Topic: graphs. There are count courses numbered from 0. A pair [course, required] means required must come first. Return whether a full order exists.","canFinishCourses(2, [[1, 0]])", course(2,[[1,0]]))
    add("medium","extra-cable","Extra cable","extraCable(nodes: number, cables: [number, number][]): [number, number]","Topic: union-find. Nodes are 1 through nodes. cables would form a tree except one extra edge. Return that edge. If several extras exist, return the last one in the input.","extraCable(3, [[1, 2], [1, 3], [2, 3]])", redundant(3,[[1,2],[1,3],[2,3]]))
    add("medium","signal-delay","Signal delay","signalDelay(nodes: number, links: [number, number, number][], start: number): number","Topic: graphs. Nodes are numbered from 1. A link is [from, to, minutes]. Return the minutes until every node has the signal from start, or -1 if some node never receives it.","signalDelay(4, [[2, 1, 1], [2, 3, 1], [3, 4, 1]], 2)", delay(4,[[2,1,1],[2,3,1],[3,4,1]],2))
    add("hard","cheapest-hops","Cheapest route with a hop cap","cheapestHops(cities: number, flights: [number, number, number][], start: number, end: number, stops: number): number","Topic: graphs. A flight is [from, to, price]. You may take at most stops layovers, so at most stops+1 flights. Return the cheapest price, or -1.","cheapestHops(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1)", cheap(4,[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],0,3,1))
    add("hard","word-ladder-length","Word ladder length","wordLadderLength(begin: string, end: string, words: string[]): number","Topic: BFS. Each step changes one letter and must land on a word in words. Return the length of the shortest ladder including begin, or 0 if end is unreachable.","wordLadderLength('hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog'])", ladder_len("hit","cog",["hot","dot","dog","lot","log","cog"]))
    add("medium","polish-value","Reverse polish value","polishValue(tokens: string[]): number","Topic: stack. Tokens are integers or + - * /. Division truncates toward zero. Return the value of the expression.","polishValue(['2', '1', '+', '3', '*'])", rpn(["2","1","+","3","*"]))
    add("medium","short-path","Short path","shortPath(path: string): string","Topic: stack. path is a Unix path. '.' stays, '..' goes up, and repeated slashes collapse. Return the canonical path.","shortPath('/home//desk/../docs/')", simplify("/home//desk/../docs/"))
    add("medium","repeat-marker","Repeat marker","expandMarkers(text: string): string","Topic: stack. k[text] means text repeated k times. Markers nest. Digits form the repeat count. Return the expanded string.","expandMarkers('3[a2[c]]')", decode_str("3[a2[c]]"))
    add("easy","keypad-count","Keypad count","keypadCount(digits: string): number","Topic: recursion. Digits 2 through 9 map to the usual phone letters. Return how many strings those digits can spell. An empty digit string returns 0.","keypadCount('23')", letter_count("23"))
    add("medium","pair-count","Balanced pair count","balancedPairCount(pairs: number): number","Topic: DP. Return how many strings of pairs pairs of parentheses are correctly balanced.","balancedPairCount(3)", paren_count(3))
    add("easy","subset-count","Subset count","subsetCount(values: number[]): number","Topic: combinatorics. Values are distinct. Return how many subsets exist, including the empty subset.","subsetCount([1, 2, 3])", subset_count([1,2,3]))
    add("easy","order-count","Order count","orderCount(values: number[]): number","Topic: combinatorics. Values are distinct. Return how many orders of the whole list exist.","orderCount([1, 2, 3])", perm_count([1,2,3]))
    add("medium","unbounded-pick-count","Unbounded pick count","unboundedPickCount(options: number[], target: number): number","Topic: DP. You may reuse options. Count combinations that add to target. Order does not matter.","unboundedPickCount([2, 3, 6, 7], 7)", comb_sum_count([2,3,6,7],7))
    add("medium","signed-target","Signed target","signedTarget(values: number[], target: number): number","Topic: DP. Put + or - before each value. Count the assignments whose total equals target.","signedTarget([1, 1, 1, 1, 1], 3)", target_sum([1,1,1,1,1],3))
    add("medium","pack-value","Pack value","packValue(weights: number[], values: number[], capacity: number): number","Topic: DP. Each item may be taken at most once. Return the greatest value that fits in capacity.","packValue([1, 3, 4], [15, 20, 30], 4)", knap([1,3,4],[15,20,30],4))
    add("medium","shared-sequence","Shared sequence","sharedSequence(left: string, right: string): number","Topic: DP. Return the length of the longest subsequence shared by both strings. It need not be contiguous.","sharedSequence('abcde', 'ace')", lcs("abcde","ace"))
    add("medium","shared-slice","Shared slice","sharedSlice(left: string, right: string): number","Topic: DP. Return the length of the longest contiguous slice shared by both strings.","sharedSlice('abcde', 'abfce')", lcsub("abcde","abfce"))
    add("hard","cuts-to-mirror","Deletions to a mirror","deletionsToMirror(text: string): number","Topic: DP. Delete as few characters as possible so the rest reads the same forward and backward. Return that count.","deletionsToMirror('aebcbda')", min_del_pal("aebcbda"))
    add("hard","mirror-cuts","Mirror cuts","mirrorCuts(text: string): number","Topic: DP. Cut the text into pieces that each read the same forward and backward. Return the fewest cuts. A string that is already a mirror needs 0.","mirrorCuts('aab')", pal_cuts("aab"))
    add("medium","largest-square","Largest square of ones","largestSquare(grid: string[][]): number","Topic: DP. Cells are '0' or '1'. Return the area of the largest square of ones.","largestSquare([['1','0','1','0','0'],['1','0','1','1','1'],['1','1','1','1','1'],['1','0','0','1','0']])", max_square([["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]))
    add("hard","histogram-area","Largest histogram area","histogramArea(heights: number[]): number","Topic: stack. heights are bar widths of 1. Return the area of the largest rectangle that fits under the skyline of the bars.","histogramArea([2, 1, 5, 6, 2, 3])", hist([2,1,5,6,2,3]))
    add("hard","trapped-rain","Trapped rain","trappedRain(heights: number[]): number","Topic: two pointers. heights are bar heights of width 1. Return how many units of water the bars can trap.","trappedRain([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])", trap([0,1,0,2,1,0,1,3,2,1,2,1]))
    add("medium","widest-container","Widest water container","widestContainer(heights: number[]): number","Topic: two pointers. heights[i] is a vertical line at x = i. Pick two lines. Return the greatest area of water they hold.","widestContainer([1, 8, 6, 2, 5, 4, 8, 3, 7])", container([1,8,6,2,5,4,8,3,7]))
    add("medium","warmer-days","Warmer days","warmerDays(temps: number[]): number[]","Topic: stack. For each day, return how many days until a strictly warmer temperature. Use 0 if none exists.","warmerDays([73, 74, 75, 71, 69, 72, 76, 73])", daily([73,74,75,71,69,72,76,73]))
    add("medium","asteroid-clash","Asteroid clash","asteroidClash(asteroids: number[]): number[]","Topic: stack. A positive value moves right and a negative value moves left, all at the same speed. On a collision the smaller absolute value explodes. Equal magnitudes both explode. Return the survivors in order.","asteroidClash([5, 10, -5])", asteroids([5,10,-5]))
    add("medium","smallest-unique-order","Smallest unique order","smallestUniqueOrder(text: string): string","Topic: stack. Return the smallest lexicographical string that contains each distinct character of text exactly once, and could be a subsequence of text.","smallestUniqueOrder('bcabc')", remove_dup_letters("bcabc"))
    add("hard","window-peaks","Window peaks","windowPeaks(values: number[], width: number): number[]","Topic: deque. Return the maximum of every contiguous window of the given width, from left to right.","windowPeaks([1, 3, -1, -3, 5, 3, 6, 7], 3)", window_max([1,3,-1,-3,5,3,6,7],3))
    add("medium","pattern-starts","Pattern starts","patternStarts(text: string, pattern: string): number[]","Topic: sliding window. Return every index where a permutation of pattern begins in text.","patternStarts('cbaebabacd', 'abc')", anagram_starts("cbaebabacd","abc"))
    add("medium","repeat-budget","Longest run with a budget","longestWithBudget(text: string, budget: number): number","Topic: sliding window. You may replace at most budget characters. Return the longest slice you can make into one repeated character.","longestWithBudget('AABABBA', 1)", replace_run("AABABBA",1))
    add("medium","shortest-cover-sum","Shortest cover sum","shortestCoverSum(values: number[], target: number): number","Topic: sliding window. values are positive. Return the length of the shortest contiguous slice whose sum is at least target, or 0.","shortestCoverSum([2, 3, 1, 2, 4, 3], 7)", min_sub([2,3,1,2,4,3],7))
    add("medium","sum-k-count","Slices summing to K","slicesSummingTo(values: number[], target: number): number","Topic: prefix sums. Count contiguous slices whose sum equals target. Values may be negative.","slicesSummingTo([1, 1, 1], 2)", sub_k([1,1,1],2))
    add("medium","bounded-slices","Bounded slices","boundedSlices(values: number[], low: number, high: number): number","Topic: sliding window. values are non-negative. Count contiguous slices whose sum is between low and high inclusive.","boundedSlices([2, 1, 4, 3], 2, 3)", bounded([2,1,4,3],2,3))
    add("medium","network-parts","Network parts","networkParts(nodes: number, links: [number, number][]): number","Topic: union-find. Nodes are 0 through nodes-1. An undirected link joins two nodes. Return how many connected parts there are.","networkParts(5, [[0, 1], [1, 2], [3, 4]])", components(5,[[0,1],[1,2],[3,4]]))
    add("medium","cable-cost","Minimum cable cost","cableCost(nodes: number, offers: [number, number, number][]): number","Topic: union-find. An offer is [cost, a, b] for an undirected cable. Return the cheapest way to connect nodes 0 through nodes-1, or -1 if it is impossible.","cableCost(4, [[1, 0, 1], [2, 1, 2], [4, 0, 2], [3, 2, 3]])", mst(4,[[1,0,1],[2,1,2],[4,0,2],[3,2,3]]))
    add("medium","travel-minutes","Travel minutes","travelMinutes(nodes: number, roads: [number, number, number][], start: number): number[]","Topic: graphs. A road is [from, to, minutes] and is directed. Return the minutes from start to every node 0 through nodes-1. Use -1 if a node is unreachable.","travelMinutes(4, [[0, 1, 2], [0, 2, 5], [1, 2, 1], [1, 3, 4]], 0)", dijkstra(4,[[0,1,2],[0,2,5],[1,2,1],[1,3,4]],0))
    add("medium","task-order","Task order","taskOrder(count: number, rules: [number, number][]): number[]","Topic: graphs. Tasks are 0 through count-1. A rule [before, after] means before must finish first. Return one valid order, preferring smaller numbers when several are ready. Return an empty list if a cycle exists.","taskOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]])", topo(4,[[1,0],[2,0],[3,1],[3,2]]))
    add("medium","two-teams","Two teams","canSplitTeams(people: number, rivalries: [number, number][]): boolean","Topic: graphs. People are 0 through people-1. A rivalry is undirected. Return whether everyone can be placed on one of two teams so rivals are not teammates.","canSplitTeams(4, [[0, 1], [1, 2], [2, 3]])", bipartite(4,[[0,1],[1,2],[2,3]]))
    add("medium","site-span","Longest site span","longestSiteSpan(sites: number, roads: [number, number][]): number","Topic: trees. roads form a tree on sites 0 through sites-1. Return the number of roads on the longest path.","longestSiteSpan(4, [[0, 1], [1, 2], [1, 3]])", diameter(4,[[0,1],[1,2],[1,3]]))
    add("easy","kth-sorted","Kth in sorted order","kthSorted(values: number[], k: number): number","Topic: sorting. values come from an in-order walk of a binary search tree, so they may be unsorted in this list. Return the kth smallest, counting from 1.","kthSorted([3, 1, 4, 2], 1)", kth_bst([3,1,4,2],1))
    add("medium","zero-triplets","Zero triplets","zeroTriplets(values: number[]): number","Topic: two pointers. Count unordered triplets of different indexes that add to 0. Identical multisets count once.","zeroTriplets([-1, 0, 1, 2, -1, -4])", three_sum_count([-1,0,1,2,-1,-4]))
    add("medium","best-product-slice","Best product slice","bestProductSlice(values: number[]): number","Topic: DP. Return the greatest product of a non-empty contiguous slice.","bestProductSlice([2, 3, -2, 4])", max_product([2,3,-2,4]))
    add("easy","rotate-right","Rotate right","rotateRight(values: number[], steps: number): number[]","Topic: arrays. Rotate the list to the right by steps places. steps may be larger than the length.","rotateRight([1, 2, 3, 4, 5], 2)", rotate_right_count([1,2,3,4,5],2))
    add("medium","spiral-read","Spiral read","spiralRead(matrix: number[][]): number[]","Topic: arrays. Read the matrix in clockwise spiral order.","spiralRead([[1, 2, 3], [4, 5, 6], [7, 8, 9]])", spiral_order([[1,2,3],[4,5,6],[7,8,9]]))
    add("easy","dup-and-missing","Duplicate and missing","duplicateAndMissing(values: number[]): [number, number]","Topic: hashing. values should be 1 through n, but one number repeats and one is missing. Return [duplicate, missing].","duplicateAndMissing([1, 2, 2, 4])", set_mismatch([1,2,2,4]))
    add("easy","absent-ids","Absent ids","absentIds(values: number[]): number[]","Topic: arrays. values holds n integers from 1 through n, with duplicates allowed. Return the missing numbers from that range, sorted.","absentIds([4, 3, 2, 7, 8, 2, 3, 1])", find_disappeared([4,3,2,7,8,2,3,1]))
    add("medium","citation-index","Citation index","citationIndex(citations: number[]): number","Topic: sorting. A researcher has index h if h papers have at least h citations each. Return the greatest such h.","citationIndex([3, 0, 6, 1, 5])", h_index([3,0,6,1,5]))
    add("medium","cooldown-span","Cooldown span","cooldownSpan(tasks: string[], cooldown: number): number","Topic: greedy. Identical tasks need at least cooldown other slots between them. Idle slots count. Return the shortest schedule length.","cooldownSpan(['A', 'A', 'A', 'B', 'B', 'B'], 2)", can_complete(["A","A","A","B","B","B"],2))
    add("medium","label-parts","Label parts","labelParts(text: string): number[]","Topic: greedy. Split the text so each letter appears in at most one part, and parts are as many as possible. Return the lengths in order.","labelParts('ababcbacadefegdehijhklij')", partition_labels("ababcbacadefegdehijhklij"))
    add("medium","inbox-groups","Inbox groups","inboxGroups(accounts: string[][]): number","Topic: union-find. Each account starts with a name and then email addresses. Emails that appear together belong to one person even if the names differ. Return how many distinct people there are.","inboxGroups([['Gabe', 'a@x', 'b@x'], ['Gabe', 'c@x'], ['Gabe', 'b@x', 'd@x']])", merge_accounts_count([["Gabe","a@x","b@x"],["Gabe","c@x"],["Gabe","b@x","d@x"]]))
    add("medium","island-count","Island count","islandCount(grid: string[][]): number","Topic: graphs. '1' is land and '0' is water. Land connects on edges, not corners. Return how many islands there are.","islandCount([['1','1','0'],['0','1','0'],['1','0','1']])", num_islands([["1","1","0"],["0","1","0"],["1","0","1"]]))
    add("medium","largest-island-area","Largest island area","largestIslandArea(grid: number[][]): number","Topic: graphs. 1 is land. Return the area of the largest island, or 0 if there is no land.","largestIslandArea([[0, 1, 1], [0, 1, 0], [1, 0, 0]])", max_area([[0,1,1],[0,1,0],[1,0,0]]))
    add("medium","rotten-crates","Minutes until crates spoil","minutesUntilSpoiled(grid: number[][]): number","Topic: BFS. 0 is empty, 1 is fresh, and 2 is spoiled. Each minute, spoiled crates spoil their edge neighbors. Return the minutes until every fresh crate spoils, or -1.","minutesUntilSpoiled([[2, 1, 1], [1, 1, 0], [0, 1, 1]])", oranges([[2,1,1],[1,1,0],[0,1,1]]))
    add("medium","aisle-steps","Aisle steps","aisleSteps(grid: number[][]): number","Topic: BFS. 0 is open and 1 is blocked. Move up, down, left, or right. Return the fewest steps from the top-left to the bottom-right, counting the start as 1, or -1.","aisleSteps([[0, 0, 0], [1, 1, 0], [1, 1, 0]])", walls([[0,0,0],[1,1,0],[1,1,0]]))
