
def register(add):
    def tree(vals):
        if not vals or vals[0] is None: return None
        root={"v":vals[0],"l":None,"r":None}
        q=[root]; i=1
        while q and i<len(vals):
            node=q.pop(0)
            if i<len(vals) and vals[i] is not None:
                node["l"]={"v":vals[i],"l":None,"r":None}; q.append(node["l"])
            i+=1
            if i<len(vals) and vals[i] is not None:
                node["r"]={"v":vals[i],"l":None,"r":None}; q.append(node["r"])
            i+=1
        return root
    def height(vals):
        root=tree(vals)
        def w(n):
            return 0 if not n else 1+max(w(n["l"]), w(n["r"]))
        return w(root)
    def min_depth(vals):
        root=tree(vals)
        def w(n):
            if not n: return 0
            if not n["l"]: return 1+w(n["r"])
            if not n["r"]: return 1+w(n["l"])
            return 1+min(w(n["l"]), w(n["r"]))
        return w(root)
    def balanced(vals):
        root=tree(vals)
        def w(n):
            if not n: return 0
            l,r=w(n["l"]),w(n["r"])
            if l<0 or r<0 or abs(l-r)>1: return -1
            return 1+max(l,r)
        return w(root)>=0
    def mirror(vals):
        root=tree(vals)
        def same(a,b):
            if not a or not b: return a is b
            return a["v"]==b["v"] and same(a["l"],b["r"]) and same(a["r"],b["l"])
        return True if not root else same(root["l"], root["r"])
    def path(vals, target):
        root=tree(vals)
        def w(n, left):
            if not n: return False
            if not n["l"] and not n["r"]: return left==n["v"]
            return w(n["l"], left-n["v"]) or w(n["r"], left-n["v"])
        return w(root, target)
    def diameter(vals):
        root=tree(vals); best=0
        def w(n):
            nonlocal best
            if not n: return 0
            l,r=w(n["l"]),w(n["r"])
            best=max(best,l+r)
            return 1+max(l,r)
        w(root); return best
    def invert_sum(vals):
        root=tree(vals)
        def w(n):
            if not n: return 0
            n["l"],n["r"]=n["r"],n["l"]
            return n["v"]+w(n["l"])+w(n["r"])
        return w(root)
    def same(a,b):
        def eq(x,y):
            if not x or not y: return x is y
            return x["v"]==y["v"] and eq(x["l"],y["l"]) and eq(x["r"],y["r"])
        return eq(tree(a), tree(b))
    def bst(vals):
        root=tree(vals)
        def w(n, lo, hi):
            if not n: return True
            if not lo < n["v"] < hi: return False
            return w(n["l"], lo, n["v"]) and w(n["r"], n["v"], hi)
        return w(root, float("-inf"), float("inf"))
    def kth(vals, k):
        root=tree(vals); ans=[None]
        def w(n):
            if not n or ans[0] is not None: return
            w(n["l"])
            klist[0]-=1
            if klist[0]==0: ans[0]=n["v"]
            w(n["r"])
        klist=[k]; w(root); return ans[0]
    def right(vals):
        root=tree(vals); out=[]; q=[root] if root else []
        while q:
            size=len(q); nxt=[]
            for i,n in enumerate(q):
                if i==size-1: out.append(n["v"])
                if n["l"]: nxt.append(n["l"])
                if n["r"]: nxt.append(n["r"])
            q=nxt
        return out
    def level_sums(vals):
        root=tree(vals); out=[]; q=[root] if root else []
        while q:
            out.append(sum(n["v"] for n in q))
            q=[c for n in q for c in (n["l"], n["r"]) if c]
        return out
    def max_path(vals):
        root=tree(vals); best=float("-inf")
        def w(n):
            nonlocal best
            if not n: return 0
            l,r=max(0,w(n["l"])), max(0,w(n["r"]))
            best=max(best, n["v"]+l+r)
            return n["v"]+max(l,r)
        w(root); return best
    def lca(vals, p, q):
        root=tree(vals); ans=[None]
        def w(n):
            if not n: return False
            mid=n["v"] in (p,q)
            left,right=w(n["l"]),w(n["r"])
            if (mid and left) or (mid and right) or (left and right): ans[0]=n["v"]
            return mid or left or right
        w(root); return ans[0]
    def house3(vals):
        root=tree(vals)
        def w(n):
            if not n: return (0,0)
            l,r=w(n["l"]),w(n["r"])
            take=n["v"]+l[1]+r[1]
            skip=max(l)+max(r)
            return (take, skip)
        return max(w(root))
    def range_sum(vals, lo, hi):
        root=tree(vals)
        def w(n):
            if not n: return 0
            if n["v"]<lo: return w(n["r"])
            if n["v"]>hi: return w(n["l"])
            return n["v"]+w(n["l"])+w(n["r"])
        return w(root)
    def left_leaves(vals):
        root=tree(vals)
        def w(n, left):
            if not n: return 0
            if left and not n["l"] and not n["r"]: return n["v"]
            return w(n["l"], True)+w(n["r"], False)
        return w(root, False)
    def count(vals):
        root=tree(vals)
        def w(n):
            return 0 if not n else 1+w(n["l"])+w(n["r"])
        return w(root)
    def good(vals):
        root=tree(vals)
        def w(n, mx):
            if not n: return 0
            ok=1 if n["v"]>=mx else 0
            nxt=max(mx, n["v"])
            return ok+w(n["l"], nxt)+w(n["r"], nxt)
        return w(root, float("-inf"))
    def ship(weights, days):
        lo, hi = max(weights), sum(weights)
        def ok(cap):
            d=1; load=0
            for w in weights:
                if load+w>cap: d+=1; load=0
                load+=w
            return d<=days
        while lo<hi:
            mid=(lo+hi)//2
            if ok(mid): hi=mid
            else: lo=mid+1
        return lo
    def koko(piles, h):
        lo, hi = 1, max(piles)
        def ok(k):
            return sum((p+k-1)//k for p in piles)<=h
        while lo<hi:
            mid=(lo+hi)//2
            if ok(mid): hi=mid
            else: lo=mid+1
        return lo
    def split(a, k):
        lo, hi = max(a), sum(a)
        def ok(cap):
            parts=1; load=0
            for n in a:
                if load+n>cap: parts+=1; load=0
                load+=n
            return parts<=k
        while lo<hi:
            mid=(lo+hi)//2
            if ok(mid): hi=mid
            else: lo=mid+1
        return lo
    def bloom(bloom, m, k):
        if m*k>len(bloom): return -1
        lo, hi = 1, max(bloom)
        def ok(day):
            run=made=0
            for b in bloom:
                run = run+1 if b<=day else 0
                if run==k: made+=1; run=0
            return made>=m
        while lo<hi:
            mid=(lo+hi)//2
            if ok(mid): hi=mid
            else: lo=mid+1
        return lo
    def cows(stalls, k):
        a=sorted(stalls); lo, hi = 0, a[-1]-a[0]
        def ok(dist):
            placed=1; last=a[0]
            for s in a:
                if s-last>=dist: placed+=1; last=s
            return placed>=k
        while lo<hi:
            mid=(lo+hi+1)//2
            if ok(mid): lo=mid
            else: hi=mid-1
        return lo
    def wood(trees, need):
        lo, hi = 0, max(trees)
        def cut(h):
            return sum(max(0,t-h) for t in trees)
        while lo<hi:
            mid=(lo+hi+1)//2
            if cut(mid)>=need: lo=mid
            else: hi=mid-1
        return lo
    def divisor(a, threshold):
        lo, hi = 1, max(a)
        import math
        def ok(d):
            return sum(math.ceil(n/d) for n in a)<=threshold
        while lo<hi:
            mid=(lo+hi)//2
            if ok(mid): hi=mid
            else: lo=mid+1
        return lo
    def find_min(a):
        lo, hi = 0, len(a)-1
        while lo<hi:
            mid=(lo+hi)//2
            if a[mid]>a[hi]: lo=mid+1
            else: hi=mid
        return a[lo]
    def search_matrix(m, target):
        if not m or not m[0]: return False
        lo, hi = 0, len(m)*len(m[0])-1
        cols=len(m[0])
        while lo<=hi:
            mid=(lo+hi)//2
            v=m[mid//cols][mid%cols]
            if v==target: return True
            if v<target: lo=mid+1
            else: hi=mid-1
        return False
    def kth_matrix(m, k):
        n=len(m); lo, hi = m[0][0], m[-1][-1]
        def count(x):
            c=row=0; col=n-1
            row=n-1; col=0
            c=0
            while row>=0 and col<n:
                if m[row][col]<=x:
                    c+=row+1; col+=1
                else: row-=1
            return c
        while lo<hi:
            mid=(lo+hi)//2
            if count(mid)>=k: hi=mid
            else: lo=mid+1
        return lo
    def peak(a):
        lo, hi=0, len(a)-1
        while lo<hi:
            mid=(lo+hi)//2
            if a[mid]<a[mid+1]: lo=mid+1
            else: hi=mid
        return lo
    def insert_index(a, t):
        lo, hi=0, len(a)
        while lo<hi:
            mid=(lo+hi)//2
            if a[mid]<t: lo=mid+1
            else: hi=mid
        return lo
    def kth_gap(a, k):
        b=sorted(a); lo, hi=0, b[-1]-b[0]
        def count(dist):
            n=j=0
            for i in range(len(b)):
                while b[i]-b[j]>dist: j+=1
                n+=i-j
            return n
        while lo<hi:
            mid=(lo+hi)//2
            if count(mid)>=k: hi=mid
            else: lo=mid+1
        return lo
    def lps(s):
        n=len(s)
        dp=[[0]*n for _ in range(n)]
        for i in range(n-1,-1,-1):
            dp[i][i]=1
            for j in range(i+1,n):
                dp[i][j]=dp[i+1][j-1]+2 if s[i]==s[j] else max(dp[i+1][j], dp[i][j-1])
        return dp[0][n-1]
    def count_pal(s):
        n=len(s); count=0
        dp=[[False]*n for _ in range(n)]
        for i in range(n-1,-1,-1):
            for j in range(i,n):
                if s[i]==s[j] and (j-i<2 or dp[i+1][j-1]):
                    dp[i][j]=True; count+=1
        return count
    def longest_pal_slice(s):
        best=0; n=len(s)
        for c in range(n):
            for l,r in ((c,c),(c,c+1)):
                while l>=0 and r<n and s[l]==s[r]:
                    best=max(best, r-l+1); l-=1; r+=1
        return best
    def partition(a):
        total=sum(a)
        if total%2: return False
        target=total//2
        dp=[True]+[False]*target
        for n in a:
            for x in range(target, n-1, -1):
                dp[x]=dp[x] or dp[x-n]
        return dp[target]
    def target_sum(a, target):
        total=sum(a)
        if (total+target)%2 or abs(target)>total: return 0
        need=(total+target)//2
        dp=[1]+[0]*need
        for n in a:
            for x in range(need, n-1, -1):
                dp[x]+=dp[x-n]
        return dp[need]
    def last_stone(a):
        import heapq
        h=[-n for n in a]; heapq.heapify(h)
        while len(h)>1:
            y=-heapq.heappop(h); x=-heapq.heappop(h)
            if y!=x: heapq.heappush(h, -(y-x))
        return -h[0] if h else 0
    def stone_split(a):
        total=sum(a); target=total//2
        dp=[False]*(target+1); dp[0]=True
        for n in a:
            for x in range(target, n-1, -1):
                dp[x]=dp[x] or dp[x-n]
        while target and not dp[target]: target-=1
        return total-2*target
    def comb_order(cands, target):
        dp=[0]*(target+1); dp[0]=1
        for x in range(1, target+1):
            for c in cands:
                if c<=x: dp[x]+=dp[x-c]
        return dp[target]
    def comb_set(cands, target):
        dp=[0]*(target+1); dp[0]=1
        for c in cands:
            for x in range(c, target+1):
                dp[x]+=dp[x-c]
        return dp[target]
    def paren_count(n):
        dp=[0]*(n+1); dp[0]=1
        for i in range(1,n+1):
            for j in range(i):
                dp[i]+=dp[j]*dp[i-1-j]
        return dp[n]
    def letters(digits):
        mp={"2":3,"3":3,"4":3,"5":3,"6":3,"7":4,"8":3,"9":4}
        if not digits: return 0
        p=1
        for d in digits: p*=mp[d]
        return p
    def ransom(note, mag):
        from collections import Counter
        m=Counter(mag)
        return not (Counter(note)-m)
    def anagram(a,b):
        from collections import Counter
        return Counter(a)==Counter(b)
    def fib(n):
        a,b=0,1
        for _ in range(n):
            a,b=b,a+b
        return a
    def trib(n):
        if n==0: return 0
        if n<3: return 1
        a,b,c=0,1,1
        for _ in range(3,n+1):
            a,b,c=b,c,a+b+c
        return c
    def pascal(k):
        row=[1]
        for i in range(1,k+1):
            row.append(row[-1]*(k-i+1)//i)
        return row
    def add_digits(n):
        return 0 if n==0 else 1+(n-1)%9
    def ugly(n):
        if n<=0: return False
        for p in (2,3,5):
            while n%p==0: n//=p
        return n==1
    def nth_ugly(n):
        dp=[1]; i2=i3=i5=0
        while len(dp)<n:
            nxt=min(dp[i2]*2, dp[i3]*3, dp[i5]*5)
            dp.append(nxt)
            if nxt==dp[i2]*2: i2+=1
            if nxt==dp[i3]*3: i3+=1
            if nxt==dp[i5]*5: i5+=1
        return dp[n-1]
    def primes(n):
        if n<3: return 0
        mark=[True]*n; mark[0]=mark[1]=False
        i=2
        while i*i<n:
            if mark[i]:
                for j in range(i*i, n, i): mark[j]=False
            i+=1
        return sum(mark)
    def pow3(n):
        if n<1: return False
        while n%3==0: n//=3
        return n==1
    def pow4(n):
        return n>0 and n&(n-1)==0 and n&0x55555555!=0
    def iso(a,b):
        if len(a)!=len(b): return False
        ab={}; ba={}
        for x,y in zip(a,b):
            if ab.get(x,y)!=y or ba.get(y,x)!=x: return False
            ab[x]=y; ba[y]=x
        return True
    def pattern(p,s):
        words=s.split()
        if len(words)!=len(p): return False
        return iso(p, words)
    def pal_build(s):
        from collections import Counter
        odd=length=0
        for c in Counter(s).values():
            length += c-c%2
            odd |= c%2
        return length+odd
    def first_unique(s):
        from collections import Counter
        m=Counter(s)
        for i,c in enumerate(s):
            if m[c]==1: return i
        return -1
    def strstr(h,n):
        return h.find(n)
    def last_word(s):
        return len(s.split()[-1])
    def vowels(s):
        a=list(s); v=set("aeiouAEIOU"); i,j=0,len(a)-1
        while i<j:
            while i<j and a[i] not in v: i+=1
            while i<j and a[j] not in v: j-=1
            a[i],a[j]=a[j],a[i]; i+=1; j-=1
        return "".join(a)
    def subseq(a,b):
        i=0
        for c in b:
            if i<len(a) and c==a[i]: i+=1
        return i==len(a)
    def intersect(a,b):
        from collections import Counter
        m=Counter(a); out=[]
        for n in b:
            if m[n]:
                out.append(n); m[n]-=1
        return sorted(out)
    def third(a):
        u=sorted(set(a), reverse=True)
        return u[2] if len(u)>=3 else u[0]
    def ranges(a):
        out=[]; i=0
        while i<len(a):
            j=i
            while j+1<len(a) and a[j+1]==a[j]+1: j+=1
            out.append(str(a[i]) if i==j else f"{a[i]}->{a[j]}")
            i=j+1
        return out
    def perimeter(g):
        p=0; R,C=len(g),len(g[0])
        for r in range(R):
            for c in range(C):
                if g[r][c]:
                    p+=4
                    if r and g[r-1][c]: p-=2
                    if c and g[r][c-1]: p-=2
        return p
    def max_ones(a):
        best=cur=0
        for n in a:
            cur = cur+1 if n else 0
            best=max(best,cur)
        return best
    def extra(s,t):
        x=0
        for c in s+t: x^=ord(c)
        return chr(x)
    def flowers(bed, n):
        a=[0]+bed+[0]; placed=0
        for i in range(1,len(a)-1):
            if not a[i-1] and not a[i] and not a[i+1]:
                a[i]=1; placed+=1
        return placed>=n
    def max_avg(a,k):
        s=sum(a[:k]); best=s
        for i in range(k,len(a)):
            s+=a[i]-a[i-k]; best=max(best,s)
        return best/k
    def disappeared(a):
        b=a[:]; 
        for n in b:
            i=abs(n)-1
            if b[i]>0: b[i]=-b[i]
        return [i+1 for i,v in enumerate(b) if v>0]
    def mismatch(a):
        seen=set(); dup=0; s=0
        for n in a:
            if n in seen: dup=n
            seen.add(n); s+=n
        n=len(a)
        return [dup, n*(n+1)//2 - (s-dup)]
    def degree(a):
        first={}; count={}; last={}; best=0; length=len(a)
        for i,n in enumerate(a):
            first.setdefault(n,i)
            count[n]=count.get(n,0)+1
            last[n]=i
            span=last[n]-first[n]+1
            if count[n]>best or (count[n]==best and span<length):
                best=count[n]; length=span
        return length
    def cont(a):
        best=cur=1
        for i in range(1,len(a)):
            cur = cur+1 if a[i]>a[i-1] else 1
            best=max(best,cur)
        return best
    def baseball(ops):
        st=[]
        for op in ops:
            if op=="+": st.append(st[-1]+st[-2])
            elif op=="D": st.append(st[-1]*2)
            elif op=="C": st.pop()
            else: st.append(int(op))
        return sum(st)

    T=[3,9,20,None,None,15,7]
    add("easy","tree-height","Tree height","treeHeight(level: (number | null)[]): number","Topic: trees. level is a binary tree in level order, using null for a missing child. Return the node count of the longest root-to-leaf path. An empty tree has height 0.","treeHeight([3, 9, 20, null, null, 15, 7])", height(T))
    add("easy","shallow-leaf","Shallowest leaf","shallowestLeaf(level: (number | null)[]): number","Topic: trees. Return the node count of the shortest root-to-leaf path.","shallowestLeaf([2, null, 3, null, 4])", min_depth([2,None,3,None,4]))
    add("easy","balanced-tree","Balanced tree","isBalancedTree(level: (number | null)[]): boolean","Topic: trees. Return whether every node's subtrees differ in height by at most one.","isBalancedTree([3, 9, 20, null, null, 15, 7])", balanced(T))
    add("easy","mirror-tree","Mirror tree","isMirrorTree(level: (number | null)[]): boolean","Topic: trees. Return whether the tree is symmetric around its center.","isMirrorTree([1, 2, 2, 3, 4, 4, 3])", mirror([1,2,2,3,4,4,3]))
    add("easy","root-to-leaf-target","Root to leaf target","hasRootSum(level: (number | null)[], target: number): boolean","Topic: trees. Return whether some root-to-leaf path sums to target.","hasRootSum([5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], 22)", path([5,4,8,11,None,13,4,7,2,None,None,None,1],22))
    add("easy","tree-width","Tree width in edges","treeWidth(level: (number | null)[]): number","Topic: trees. Return the number of edges on the longest path between any two nodes.","treeWidth([1, 2, 3, 4, 5])", diameter([1,2,3,4,5]))
    add("easy","mirror-sum","Mirror and sum","mirrorSum(level: (number | null)[]): number","Topic: trees. Swap every node's children, then return the sum of the values.","mirrorSum([4, 2, 7, 1, 3, 6, 9])", invert_sum([4,2,7,1,3,6,9]))
    add("easy","same-trees","Same trees","sameTrees(a: (number | null)[], b: (number | null)[]): boolean","Topic: trees. Return whether the two level-order trees match in shape and values.","sameTrees([1, 2, 3], [1, 2, 3])", same([1,2,3],[1,2,3]))
    add("medium","search-tree-ok","Search tree check","searchTreeOk(level: (number | null)[]): boolean","Topic: trees. Return whether the tree is a binary search tree with strict inequalities.","searchTreeOk([2, 1, 3])", bst([2,1,3]))
    add("medium","kth-tree-value","Kth tree value","kthTreeValue(level: (number | null)[], k: number): number","Topic: trees. The tree is a binary search tree. Return the kth smallest value, counting from 1.","kthTreeValue([3, 1, 4, null, 2], 1)", kth([3,1,4,None,2],1))
    add("medium","right-edge","Right edge","rightEdge(level: (number | null)[]): number[]","Topic: trees. Return the rightmost value of each level, top to bottom.","rightEdge([1, 2, 3, null, 5, null, 4])", right([1,2,3,None,5,None,4]))
    add("easy","level-sums","Level sums","levelSums(level: (number | null)[]): number[]","Topic: trees. Return the sum of each level from the root down.","levelSums([1, 2, 3])", level_sums([1,2,3]))
    add("hard","best-tree-path","Best tree path","bestTreePath(level: (number | null)[]): number","Topic: trees, dynamic programming. A path follows parent links and may start and end anywhere. Values may be negative. Return the best path sum.","bestTreePath([-10, 9, 20, null, null, 15, 7])", max_path([-10,9,20,None,None,15,7]))
    add("medium","shared-ancestor","Shared ancestor","sharedAncestor(level: (number | null)[], a: number, b: number): number","Topic: trees. Values are unique. Return the lowest node that has both values in its subtree. A node counts as being in its own subtree.","sharedAncestor([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1)", lca([3,5,1,6,2,0,8,None,None,7,4],5,1))
    add("medium","tree-loot","Tree loot","treeLoot(level: (number | null)[]): number","Topic: trees, dynamic programming. You cannot take a node and its child. Return the best sum.","treeLoot([3, 2, 3, null, 3, null, 1])", house3([3,2,3,None,3,None,1]))
    add("easy","range-tree-sum","Range tree sum","rangeTreeSum(level: (number | null)[], low: number, high: number): number","Topic: trees. The tree is a binary search tree. Sum the values inside the inclusive range.","rangeTreeSum([10, 5, 15, 3, 7, null, 18], 7, 15)", range_sum([10,5,15,3,7,None,18],7,15))
    add("easy","left-leaves","Left leaves","leftLeaves(level: (number | null)[]): number","Topic: trees. Return the sum of leaves that are left children.","leftLeaves([3, 9, 20, null, null, 15, 7])", left_leaves(T))
    add("easy","node-count","Node count","nodeCount(level: (number | null)[]): number","Topic: trees. Return how many nodes the tree holds.","nodeCount([1, 2, 3, 4])", count([1,2,3,4]))
    add("medium","good-nodes","Good nodes","goodNodes(level: (number | null)[]): number","Topic: trees. A node is good when no value on the path from the root is strictly greater. Return how many good nodes there are.","goodNodes([3, 1, 4, 3, null, 1, 5])", good([3,1,4,3,None,1,5]))
    add("medium","ship-capacity","Ship capacity","shipCapacity(weights: number[], days: number): number","Topic: binary search. Packages ship in order. Each day takes a contiguous prefix that fits the capacity. Return the smallest capacity that finishes within days.","shipCapacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)", ship([1,2,3,4,5,6,7,8,9,10],5))
    add("medium","eating-speed","Eating speed","eatingSpeed(piles: number[], hours: number): number","Topic: binary search. Each hour you eat up to speed items from one pile. Return the smallest speed that finishes within hours.","eatingSpeed([3, 6, 7, 11], 8)", koko([3,6,7,11],8))
    add("hard","fairest-split","Fairest split","fairestSplit(values: number[], parts: number): number","Topic: binary search. Split the array into parts non-empty contiguous parts, in order. Minimize the largest part sum and return it.","fairestSplit([7, 2, 5, 10, 8], 2)", split([7,2,5,10,8],2))
    add("medium","bloom-day","Bloom day","bloomDay(bloom: number[], bouquets: number, adjacent: number): number","Topic: binary search. bloom[i] is the day flower i opens. A bouquet needs that many adjacent open flowers. Return the earliest day you can make the bouquets, or -1.","bloomDay([1, 10, 3, 10, 2], 3, 1)", bloom([1,10,3,10,2],3,1))
    add("medium","stall-gap","Stall gap","stallGap(stalls: number[], cows: number): number","Topic: binary search. Place that many cows on the stall positions and maximize the minimum distance. Return that distance.","stallGap([1, 2, 4, 8, 9], 3)", cows([1,2,4,8,9],3))
    add("medium","saw-height","Saw height","sawHeight(trees: number[], need: number): number","Topic: binary search. A saw at height h collects max(0, tree-h) from each tree. Return the highest h that still collects at least need wood.","sawHeight([20, 15, 10, 17], 7)", wood([20,15,10,17],7))
    add("medium","smallest-divisor","Smallest divisor","smallestDivisor(values: number[], threshold: number): number","Topic: binary search. Replace each value by its ceiling quotient with d. Return the smallest positive d whose quotients sum to at most threshold.","smallestDivisor([1, 2, 5, 9], 6)", divisor([1,2,5,9],6))
    add("medium","rotated-minimum","Rotated minimum","rotatedMinimum(values: number[]): number","Topic: binary search. The unique values were sorted and then rotated. Return the minimum.","rotatedMinimum([3, 4, 5, 1, 2])", find_min([3,4,5,1,2]))
    add("medium","matrix-search","Matrix search","matrixSearch(grid: number[][], target: number): boolean","Topic: binary search. Each row is sorted, and each row starts after the previous row ends. Return whether target occurs.","matrixSearch([[1, 3, 5], [7, 9, 11]], 9)", search_matrix([[1,3,5],[7,9,11]],9))
    add("hard","kth-in-sorted-grid","Kth in a sorted grid","kthInSortedGrid(grid: number[][], k: number): number","Topic: binary search. The grid is square. Rows and columns are sorted ascending. Return the kth smallest value, from 1.","kthInSortedGrid([[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8)", kth_matrix([[1,5,9],[10,11,13],[12,13,15]],8))
    add("easy","mountain-peak","Mountain peak","mountainPeak(heights: number[]): number","Topic: binary search. The heights rise strictly and then fall strictly. Return the peak index.","mountainPeak([0, 2, 1, 0])", peak([0,2,1,0]))
    add("easy","insert-index","Insert index","insertIndex(values: number[], target: number): number","Topic: binary search. values is sorted. Return the index of target or where it should be inserted.","insertIndex([1, 3, 5, 6], 5)", insert_index([1,3,5,6],5))
    add("easy","first-bad-build","First bad build","firstBadBuild(builds: number, badAt: number): number","Topic: binary search. Builds 1 through builds are bad from badAt onward. Return the first bad build.","firstBadBuild(5, 4)", 4)
    add("hard","kth-pair-gap","Kth pair gap","kthPairGap(values: number[], k: number): number","Topic: binary search. Return the kth smallest absolute difference between two different indexes, counting from 1.","kthPairGap([1, 3, 1], 1)", kth_gap([1,3,1],1))
    add("medium","pal-subseq-len","Palindromic subsequence length","palSubseqLength(text: string): number","Topic: dynamic programming. Return the longest palindromic subsequence length.","palSubseqLength('bbbab')", lps("bbbab"))
    add("hard","inserts-for-pal","Inserts to make a palindrome","insertsForPalindrome(text: string): number","Topic: dynamic programming. Return the fewest insertions that make text a palindrome.","insertsForPalindrome('mbadm')", len("mbadm")-lps("mbadm"))
    add("medium","pal-slice-count","Palindromic slice count","palSliceCount(text: string): number","Topic: dynamic programming. Count palindromic substrings, including single letters.","palSliceCount('aaa')", count_pal("aaa"))
    add("medium","longest-pal-slice","Longest palindromic slice","longestPalSlice(text: string): number","Topic: strings. Return the length of the longest palindromic substring.","longestPalSlice('babad')", longest_pal_slice("babad"))
    add("medium","equal-halves","Equal halves","canSplitEven(values: number[]): boolean","Topic: knapsack. Return whether the values split into two groups with equal sum.","canSplitEven([1, 5, 11, 5])", partition([1,5,11,5]))
    add("medium","sign-ways","Sign ways","signWays(values: number[], target: number): number","Topic: dynamic programming. Put + or - before each value. Count the ways to reach target.","signWays([1, 1, 1, 1, 1], 3)", target_sum([1,1,1,1,1],3))
    add("easy","last-stone","Last stone","lastStone(weights: number[]): number","Topic: heaps. Smash the two heaviest stones and put back a positive difference. Return the last weight, or 0.","lastStone([2, 7, 4, 1, 8, 1])", last_stone([2,7,4,1,8,1]))
    add("medium","closest-stone-split","Closest stone split","closestStoneSplit(weights: number[]): number","Topic: knapsack. Split the stones into two piles and return the smallest absolute difference of the sums.","closestStoneSplit([2, 7, 4, 1, 8, 1])", stone_split([2,7,4,1,8,1]))
    add("medium","combo-orders","Combination orders","comboOrders(choices: number[], target: number): number","Topic: dynamic programming. Distinct positive choices may be reused, and order matters. Count sequences that sum to target.","comboOrders([1, 2, 3], 4)", comb_order([1,2,3],4))
    add("medium","combo-sets","Combination sets","comboSets(choices: number[], target: number): number","Topic: dynamic programming. Distinct positive choices may be reused, and order does not matter. Count combinations that sum to target.","comboSets([2, 3, 5], 8)", comb_set([2,3,5],8))
    add("medium","paren-strings","Parenthesis strings","parenStringCount(pairs: number): number","Topic: dynamic programming. Count valid strings that use exactly that many pairs of parentheses.","parenStringCount(3)", paren_count(3))
    add("medium","digit-letter-count","Digit letter count","digitLetterCount(digits: string): number","Topic: backtracking. Digits 2 through 9 map to phone letters, with 7 and 9 having four. Count the strings those digits spell. Empty input spells nothing.","digitLetterCount('23')", letters("23"))
    add("easy","subset-count","Subset count","subsetCount(n: number): number","Topic: combinatorics. Return how many subsets a set of n distinct items has, including the empty set.","subsetCount(4)", 2**4)
    add("easy","order-count","Order count","orderCount(n: number): number","Topic: combinatorics. Return how many orders n distinct items have. Zero items have one empty order. n is at most 10.","orderCount(4)", 24)
    add("easy","ransom-note","Ransom note","canWriteNote(note: string, magazine: string): boolean","Topic: hashing. Return whether magazine can supply every letter of note, counting repeats. Case matters.","canWriteNote('aa', 'aab')", ransom("aa","aab"))
    add("easy","same-letters","Same letters","sameLetters(a: string, b: string): boolean","Topic: hashing. Return whether the strings are anagrams.","sameLetters('anagram', 'nagaram')", anagram("anagram","nagaram"))
    add("easy","fib-index","Fibonacci index","fibIndex(n: number): number","Topic: dynamic programming. F(0)=0, F(1)=1, and later terms add the previous two. Return F(n).","fibIndex(7)", fib(7))
    add("easy","trib-index","Tribonacci index","tribIndex(n: number): number","Topic: dynamic programming. T(0)=0, T(1)=T(2)=1, and later terms add the previous three. Return T(n).","tribIndex(5)", trib(5))
    add("easy","pascal-row","Pascal row","pascalRow(index: number): number[]","Topic: math. Return row index of Pascal's triangle. Row 0 is [1].","pascalRow(3)", pascal(3))
    add("easy","digit-root","Digit root","digitRoot(n: number): number","Topic: math. Sum digits repeatedly until one digit remains. Return it.","digitRoot(38)", add_digits(38))
    add("easy","ugly-number","Ugly number","isUgly(n: number): boolean","Topic: math. A positive ugly number's prime factors are only 2, 3, and 5. Return whether n is ugly.","isUgly(6)", ugly(6))
    add("medium","nth-ugly","Nth ugly number","nthUgly(n: number): number","Topic: dynamic programming. Ugly numbers use only primes 2, 3, and 5, starting at 1. Return the nth.","nthUgly(10)", nth_ugly(10))
    add("medium","primes-below","Primes below","primesBelow(n: number): number","Topic: math. Return how many primes are strictly less than n.","primesBelow(10)", primes(10))
    add("easy","power-of-three","Power of three","isPowerOfThree(n: number): boolean","Topic: math. Return whether n is 3 raised to a non-negative integer.","isPowerOfThree(27)", pow3(27))
    add("easy","power-of-four","Power of four","isPowerOfFour(n: number): boolean","Topic: bits. Return whether n is 4 raised to a non-negative integer.","isPowerOfFour(16)", pow4(16))
    add("easy","same-shape","Same shape","sameShape(a: string, b: string): boolean","Topic: hashing. Return whether a one-to-one letter map turns a into b.","sameShape('paper', 'title')", iso("paper","title"))
    add("easy","word-pattern","Word pattern","matchesWordPattern(pattern: string, sentence: string): boolean","Topic: hashing. Map each pattern letter to one word and each word to one letter. Return whether that rebuilds the sentence.","matchesWordPattern('abba', 'dog cat cat dog')", pattern("abba","dog cat cat dog"))
    add("easy","longest-pal-build","Longest palindrome you can build","longestPalBuild(letters: string): number","Topic: hashing. Using each letter at most as often as it appears, return the longest palindrome length you can build.","longestPalBuild('abccccdd')", pal_build("abccccdd"))
    add("easy","first-single","First single letter","firstSingle(text: string): number","Topic: hashing. Return the index of the first letter that appears once, or -1.","firstSingle('stress')", first_unique("stress"))
    add("easy","find-marker","Find the marker","findMarker(log: string, marker: string): number","Topic: strings. Return the first index of marker in log, or -1.","findMarker('hello', 'll')", strstr("hello","ll"))
    add("easy","last-token","Last token","lastTokenLength(text: string): number","Topic: strings. Return the length of the last word. text contains at least one word.","lastTokenLength('dock lights on')", last_word("dock lights on"))
    add("easy","swap-vowels","Swap vowels","swapVowels(text: string): string","Topic: two pointers. Reverse only the vowels. Other characters stay.","swapVowels('hello')", vowels("hello"))
    add("easy","keeps-order","Keeps order","keepsOrder(needle: string, hay: string): boolean","Topic: two pointers. Return whether needle is a subsequence of hay.","keepsOrder('abc', 'ahbgdc')", subseq("abc","ahbgdc"))
    add("easy","shared-counts","Shared counts","sharedCounts(a: number[], b: number[]): number[]","Topic: hashing. Return values present in both arrays, repeating a value min(countA, countB) times, sorted ascending.","sharedCounts([1, 2, 2, 1], [2, 2])", intersect([1,2,2,1],[2,2]))
    add("easy","third-distinct","Third distinct max","thirdDistinct(values: number[]): number","Topic: sorting. Return the third largest distinct value, or the largest if fewer than three distinct values exist.","thirdDistinct([3, 2, 3, 1, 2, 4])", third([3,2,3,1,2,4]))
    add("easy","range-labels","Range labels","rangeLabels(values: number[]): string[]","Topic: arrays. values is a sorted list of unique integers. Collapse each contiguous run to start->end, or a single number.","rangeLabels([0, 1, 2, 4, 5, 7])", ranges([0,1,2,4,5,7]))
    add("easy","plot-perimeter","Plot perimeter","plotPerimeter(grid: number[][]): number","Topic: grids. 1 is land. Return the perimeter.","plotPerimeter([[0, 1, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]])", perimeter([[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]))
    add("easy","longest-ones","Longest ones","longestOnes(bits: number[]): number","Topic: arrays. Return the longest contiguous run of 1s.","longestOnes([1, 1, 0, 1, 1, 1])", max_ones([1,1,0,1,1,1]))
    add("easy","extra-letter","Extra letter","extraLetter(source: string, built: string): string","Topic: bits. built is source plus one extra letter, shuffled. Return that letter.","extraLetter('abcd', 'abcde')", extra("abcd","abcde"))
    add("easy","plant-gaps","Plant the gaps","canPlant(bed: number[], flowers: number): boolean","Topic: greedy. 1 is planted. New flowers cannot touch another flower. Return whether that many fit.","canPlant([1, 0, 0, 0, 1], 1)", flowers([1,0,0,0,1],1))
    add("easy","best-window-average","Best window average","bestWindowAverage(values: number[], k: number): number","Topic: sliding window. Return the largest average of a window of length k.","bestWindowAverage([1, 12, -5, -6, 50, 3], 4)", max_avg([1,12,-5,-6,50,3],4))
    add("easy","missing-from-span","Missing from the span","missingFromSpan(ids: number[]): number[]","Topic: arrays. The list has length n and values from 1 through n, with repeats. Return the missing values in order.","missingFromSpan([4, 3, 2, 7, 8, 2, 3, 1])", disappeared([4,3,2,7,8,2,3,1]))
    add("easy","dup-and-gap","Duplicate and gap","duplicateAndGap(ids: number[]): [number, number]","Topic: math. The list should be 1 through n, but one value is duplicated and one is missing. Return [duplicate, missing].","duplicateAndGap([1, 2, 2, 4])", mismatch([1,2,2,4]))
    add("easy","hottest-span","Hottest span","hottestSpan(values: number[]): number","Topic: hashing. The degree is the highest frequency. Return the shortest slice that still has that degree.","hottestSpan([1, 2, 2, 3, 1])", degree([1,2,2,3,1]))
    add("easy","rising-stretch","Rising stretch","risingStretch(values: number[]): number","Topic: arrays. Return the longest strictly increasing contiguous stretch.","risingStretch([1, 3, 5, 4, 7])", cont([1,3,5,4,7]))
    add("easy","inning-points","Inning points","inningPoints(ops: string[]): number","Topic: stack. An integer records points. D doubles the previous record, + adds the previous two, and C cancels the previous record. Return the total that remains.","inningPoints(['5', '2', 'C', 'D', '+'])", baseball(["5","2","C","D","+"]))
