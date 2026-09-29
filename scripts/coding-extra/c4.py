
def register(add):
    def mst(n, edges):
        parent=list(range(n))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        cost=used=0
        for a,b,w in sorted(edges, key=lambda e:e[2]):
            pa,pb=find(a),find(b)
            if pa==pb: continue
            parent[pa]=pb; cost+=w; used+=1
        return cost if used==n-1 else -1
    def reconnect(n, edges):
        parent=list(range(n))
        def find(x):
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        for a,b in edges: parent[find(a)]=find(b)
        comps=len({find(i) for i in range(n)})
        return comps-1 if len(edges)>=n-1 else -1
    def equations(eqs):
        parent={}
        def find(x):
            parent.setdefault(x,x)
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        for e in eqs:
            if e[1]=="=": parent[find(e[0])]=find(e[3])
        for e in eqs:
            if e[1]=="!" and find(e[0])==find(e[3]): return False
        return True
    def accounts(rows):
        parent={}
        def find(x):
            parent.setdefault(x,x)
            while parent[x]!=x:
                parent[x]=parent[parent[x]]; x=parent[x]
            return x
        owner={}
        for name,*emails in rows:
            for email in emails:
                parent[find(email)]=find(emails[0]); owner[email]=name
        return len({find(e) for e in owner})
    def bridges(n, edges):
        g=[[] for _ in range(n)]
        for a,b in edges:
            g[a].append(b); g[b].append(a)
        tin=[-1]*n; low=[0]*n; time=[0]; count=[0]
        def dfs(u,p):
            tin[u]=low[u]=time[0]; time[0]+=1
            for v in g[u]:
                if v==p: continue
                if tin[v]<0:
                    dfs(v,u); low[u]=min(low[u], low[v])
                    if low[v]>tin[u]: count[0]+=1
                else: low[u]=min(low[u], tin[v])
        for i in range(n):
            if tin[i]<0: dfs(i,-1)
        return count[0]
    def cuts(n, edges):
        g=[[] for _ in range(n)]
        for a,b in edges:
            g[a].append(b); g[b].append(a)
        tin=[-1]*n; low=[0]*n; time=[0]; cut=set()
        def dfs(u,p):
            tin[u]=low[u]=time[0]; time[0]+=1; kids=0
            for v in g[u]:
                if v==p: continue
                if tin[v]<0:
                    kids+=1; dfs(v,u); low[u]=min(low[u], low[v])
                    if p!=-1 and low[v]>=tin[u]: cut.add(u)
                else: low[u]=min(low[u], tin[v])
            if p==-1 and kids>1: cut.add(u)
        for i in range(n):
            if tin[i]<0: dfs(i,-1)
        return len(cut)
    def scc(n, edges):
        g=[[] for _ in range(n)]; gr=[[] for _ in range(n)]
        for a,b in edges:
            g[a].append(b); gr[b].append(a)
        seen=[False]*n; order=[]
        def dfs1(u):
            seen[u]=True
            for v in g[u]:
                if not seen[v]: dfs1(v)
            order.append(u)
        for i in range(n):
            if not seen[i]: dfs1(i)
        seen=[False]*n; count=0
        def dfs2(u):
            seen[u]=True
            for v in gr[u]:
                if not seen[v]: dfs2(v)
        for u in reversed(order):
            if not seen[u]:
                count+=1; dfs2(u)
        return count
    def dij(n, edges, src, dst):
        g=[[] for _ in range(n)]
        for a,b,w in edges: g[a].append((b,w))
        dist=[10**9]*n; dist[src]=0; heap=[(0,src)]; seen=set()
        while heap:
            heap.sort(); d,u=heap.pop(0)
            if u in seen: continue
            seen.add(u)
            for v,w in g[u]:
                if d+w<dist[v]:
                    dist[v]=d+w; heap.append((dist[v],v))
        return -1 if dist[dst]>=10**9 else dist[dst]
    def bell(n, edges, src, dst):
        dist=[10**9]*n; dist[src]=0
        for _ in range(n-1):
            for u,v,w in edges:
                if dist[u]+w<dist[v]: dist[v]=dist[u]+w
        for u,v,w in edges:
            if dist[u]+w<dist[v]: return -2
        return -1 if dist[dst]>=10**9 else dist[dst]
    def floyd(n, edges, src, dst):
        d=[[10**9]*n for _ in range(n)]
        for i in range(n): d[i][i]=0
        for a,b,w in edges: d[a][b]=min(d[a][b],w)
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    d[i][j]=min(d[i][j], d[i][k]+d[k][j])
        return -1 if d[src][dst]>=10**9 else d[src][dst]
    add("medium","cable-cost","Cable cost","cableCost(points: number, edges: [number, number, number][]): number","Topic: minimum spanning tree. Undirected edges are [a, b, cost]. Connect points 0 through points-1 as cheaply as possible, or return -1.","cableCost(4, [[0, 1, 1], [1, 2, 2], [0, 2, 4], [2, 3, 3]])", mst(4,[[0,1,1],[1,2,2],[0,2,4],[2,3,3]]))
    add("medium","reconnect-ops","Reconnect operations","reconnectOps(n: number, edges: [number, number][]): number","Topic: union-find. You may move an undirected edge. Return the fewest moves that connect nodes 0 through n-1, or -1.","reconnectOps(4, [[0, 1], [0, 2], [1, 2]])", reconnect(4,[[0,1],[0,2],[1,2]]))
    add("medium","equation-check","Equation check","equationsHold(equations: string[]): boolean","Topic: union-find. Each equation is a==b or a!=b. Return whether the list can be true together.","equationsHold(['a==b', 'b!=c', 'c==a'])", equations(["a==b","b!=c","c==a"]))
    add("medium","merge-accounts","Merge accounts","mergedAccountCount(accounts: string[][]): number","Topic: union-find. A row is a name followed by emails. Shared email means one person. Return how many people there are.","mergedAccountCount([['Alex','a@x','b@x'],['Alex','b@x','c@x'],['Bob','d@x']])", accounts([["Alex","a@x","b@x"],["Alex","b@x","c@x"],["Bob","d@x"]]))
    add("hard","bridge-count","Bridge count","bridgeCount(n: number, edges: [number, number][]): number","Topic: graphs. Count undirected bridges among nodes 0 through n-1.","bridgeCount(4, [[0, 1], [1, 2], [2, 0], [1, 3]])", bridges(4,[[0,1],[1,2],[2,0],[1,3]]))
    add("hard","cut-vertices","Cut vertices","cutVertices(n: number, edges: [number, number][]): number","Topic: graphs. Count articulation points in an undirected graph.","cutVertices(5, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]])", cuts(5,[[0,1],[1,2],[2,0],[1,3],[3,4]]))
    add("hard","strong-parts","Strong parts","strongParts(n: number, edges: [number, number][]): number","Topic: graphs. Directed edges. Return the number of strongly connected components.","strongParts(5, [[1, 0], [0, 2], [2, 1], [0, 3], [3, 4]])", scc(5,[[1,0],[0,2],[2,1],[0,3],[3,4]]))
    add("medium","shortest-hop","Shortest hop","shortestHop(n: number, edges: [number, number, number][], source: number, target: number): number","Topic: Dijkstra. Directed weights are non-negative. Return the cheapest source to target cost, or -1.","shortestHop(4, [[0, 1, 1], [0, 2, 4], [1, 2, 1], [1, 3, 6], [2, 3, 1]], 0, 3)", dij(4,[[0,1,1],[0,2,4],[1,2,1],[1,3,6],[2,3,1]],0,3))
    add("hard","negative-hop","Hop with negative edges","negativeHop(n: number, edges: [number, number, number][], source: number, target: number): number","Topic: Bellman-Ford. Return the cheapest cost, -1 if unreachable, or -2 if a negative cycle can improve the route.","negativeHop(4, [[0, 1, 1], [1, 2, -2], [2, 3, 1]], 0, 3)", bell(4,[[0,1,1],[1,2,-2],[2,3,1]],0,3))
    add("medium","all-pairs-hop","One pair after all pairs","allPairsHop(n: number, edges: [number, number, number][], source: number, target: number): number","Topic: Floyd-Warshall. No negative cycle. Return the cheapest source to target cost, or -1.","allPairsHop(3, [[0, 1, 2], [1, 2, 3], [0, 2, 10]], 0, 2)", floyd(3,[[0,1,2],[1,2,3],[0,2,10]],0,2))
