var jobs = { };

onmessage = function(evt) {
    if (! evt.data.name)
        return;

    switch(evt.data.name) {
        case 'start':
            abort(evt.data.id);
            start(evt.data.id, evt.data.filename);
            break;
        case 'abort':
            abort(evt.data.id);
            break;
    };
};

var start = function(id, filename) {
    var job = jobs[id] = { };

    job.xhr = new XMLHttpRequest();

    job.xhr.addEventListener('load', function() {
        try {
            var data = JSON.parse(this.responseText);

            var unwrap = new Unwrap();
            unwrap.unwrapJsonModel(data, true, 2, true);

            postMessage({
                name: 'finish',
                id: id,
                data: data
            });
            delete job[id];
        } catch(e) {
            postMessage({
                name: 'error',
                id: id,
                err: e.message,
                stack: e.stack.split('\n')
            });
            abort(id);
        }
    });
    job.xhr.addEventListener('error', function() {
        postMessage({
            name: 'error',
            id: id,
            err: 'error loading json'
        });
        abort(id);
    });

    job.xhr.open('GET', '/api/files/assets/' + id + '/1/' + filename, true);
    job.xhr.send(null);

    postMessage('started ' + id);
};

var abort = function(id) {
    if (! jobs[id])
        return;

    delete jobs[id];
};

var Unwrap=function(){};
Unwrap.prototype={now:performance&&performance.now&&performance.timing?function(){return performance.now()}:Date.now,swap:function(b,d,e){var h=b[d];b[d]=b[e];b[e]=h},crossNormalize:function(b,d){var e=b.y*d.z-b.z*d.y,h=b.z*d.x-b.x*d.z,c=b.x*d.y-b.y*d.x,f=Math.sqrt(e*e+h*h+c*c);return{x:e/f,y:h/f,z:c/f}},triNormal:function(b,d,e,h,c,f,g,l,a){b-=h;d-=c;e-=f;h-=g;c-=l;a=f-a;f=d*a-e*c;a=e*h-b*a;b=b*c-d*h;d=Math.sqrt(f*f+a*a+b*b);return{x:f/d,y:a/d,z:b/d}},cubeFaceFromNormal:function(b){var d=Math.abs(b.x),
e=Math.abs(b.y),h=Math.abs(b.z);return d>e&&d>h?0>b.x?0:1:e>d&&e>h?0>b.y?2:3:0>b.z?4:5},boxUnwrap:function(b,d){var e=this.now(),h=d.length/3,c,f,g,l,a,m,q,u,r,w=0,k;c=0;var n=[];for(k=0;6>k;k++)n[k]=[];for(k=0;k<b.length;k+=3)c=d[3*b[k]],f=d[3*b[k]+1],g=d[3*b[k]+2],l=d[3*b[k+1]],a=d[3*b[k+1]+1],m=d[3*b[k+1]+2],q=d[3*b[k+2]],u=d[3*b[k+2]+1],r=d[3*b[k+2]+2],c=this.triNormal(c,f,g,l,a,m,q,u,r),c=this.cubeFaceFromNormal(c),n[c].push(b[k]),n[c].push(b[k+1]),n[c].push(b[k+2]);for(k=1;6>k;k++);f=[];a=[];
for(l=0;6>l;l++)for(c=l+1;6>c;c++)for(k=0;k<n[l].length;k++){f=[];for(j=0;j<n[c].length;j++)n[l][k]===n[c][j]&&f.push(j);if(0<f.length){for(j=0;j<f.length;j++)n[c][f[j]]=h;a.push(n[l][k]);h++;w++}}for(k=0;k<w;k++)d.push(d[3*a[k]]),d.push(d[3*a[k]+1]),d.push(d[3*a[k]+2]);h=[];m=[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];for(l=offset=0;6>l;l++)for(k=m[l],q=this.crossNormalize(k,.5<Math.abs(k.y)?{x:1,y:0,z:0}:{x:0,y:1,z:0}),u=this.crossNormalize(k,q),q=this.crossNormalize(k,
u),k=0;k<n[l].length;k++)b[offset]=n[l][k],c=d[3*b[offset]],f=d[3*b[offset]+1],g=d[3*b[offset]+2],h[2*b[offset]]=q.x*c+q.y*f+q.z*g,h[2*b[offset]+1]=u.x*c+u.y*f+u.z*g,offset++;console.log("BoxUnwrap time: "+(this.now()-e)/1E3);console.log("Added "+w+" verts");return{append:a,uv:h}},findCharts:function(b){var d=this.now(),e,h,c,f=[],g=0,l;for(e=0;e<b.length;e++){c=3*Math.floor(e/3);g=Math.max(c,g);0===e%3&&(l=3);for(h=g;h<b.length;h++)b[e]===b[h]&&(h=3*Math.floor(h/3),this.swap(b,g,h),this.swap(b,g+
1,h+1),this.swap(b,g+2,h+2),h+=2,g+=3,l--);2===e%3&&3>l&&(0<f.length&&f[f.length-1]>c?f[f.length-1]=g:f.push(g))}for(e=b=0;e<f.length;e++)f[e]=(f[e]-3*b)/3,b+=f[e];console.log("FindCharts time: "+(this.now()-d)/1E3);console.log("Found "+f.length+" charts");return f},triangleArea:function(b,d,e,h,c,f,g,l,a){h-=b;c-=d;f-=e;g-=b;l-=d;a-=e;b=c*a-f*l;f=f*g-h*a;h=h*l-c*g;return.5*Math.sqrt(b*b+f*f+h*h)},calculateChartArea:function(b,d,e,h){var c,f,g,l,a,m,q,u,r,w,k,n,x,p,v,t=0,z,y,D=[],F=[],H=0,I=0,A,B,
C,E,G=[];for(c=0;c<d.length;c++){g=d[c];y=z=0;A=B=99999;C=E=-99999;for(f=0;f<g;f++)l=t+f,a=b[3*l],m=b[3*l+1],l=b[3*l+2],q=e[3*a],u=e[3*a+1],r=e[3*a+2],w=e[3*m],k=e[3*m+1],n=e[3*m+2],x=e[3*l],p=e[3*l+1],v=e[3*l+2],z+=this.triangleArea(q,u,r,w,k,n,x,p,v),q=h[2*a],a=h[2*a+1],u=h[2*m],m=h[2*m+1],r=h[2*l],l=h[2*l+1],y+=this.triangleArea(q,a,0,u,m,0,r,l,0),A=Math.min(A,q),A=Math.min(A,u),A=Math.min(A,r),B=Math.min(B,a),B=Math.min(B,m),B=Math.min(B,l),C=Math.max(C,q),C=Math.max(C,u),C=Math.max(C,r),E=Math.max(E,
a),E=Math.max(E,m),E=Math.max(E,l);0===z&&(console.warn("Zero area"),y=z=.01,C=A+.01,E=B+.01);isNaN(z)&&(console.warn("NaN area"),y=z=.01,C=A+.01,E=B+.01);0===y&&(console.warn("Zero UV area"),C=A+.01,E=B+.01);H+=z;D.push(z);t+=g;G[c]={x:0,y:0,z:0,w:0};G[c].x=A;G[c].y=B;G[c].z=C-G[c].x;G[c].w=E-G[c].y;y=Math.max(G[c].z,G[c].w);y*=y;I+=y;F.push(y)}return{areas:D,areasT:F,totalArea:H,totalAreaT:I,aabbs:G}},normalizeCharts:function(b,d,e,h,c,f){b=e.areas;h=e.areasT;f=e.totalArea;var g=[];for(e=0;e<d.length;e++)c=
.8*Math.sqrt(1/h[e]*(b[e]/f)),1E5<c&&console.error("Bugged scale"),g.push(c);return g},fits:function(b,d){return b.z<=d.z&&b.w<=d.w},fitsExactly:function(b,d){return b.z===d.z&&b.w===d.w},findHoles:function(b,d,e,h,c,f,g,l){var a;e=Math.floor((b.aabb.z*this.resolution-2*this.padding)/4);var m=Math.floor((b.aabb.w*this.resolution-2*this.padding)/4);if(0>=e||0>=m)return[];var q=new Uint8Array(e*m),u=0;for(a=0;a<c.length&&a!==d;a++)u+=c[a];var r=c[d],w=g[d].x*l,k=g[d].y*l,n=g[d].z*l,x=g[d].w*l,p,v,t;
for(a=0;a<r;a++){c=f[3*(u+a)];g=f[3*(u+a)+1];d=f[3*(u+a)+2];p=h[2*c]*l;v=h[2*c+1]*l;var z=h[2*g]*l,y=h[2*g+1]*l,D=h[2*d]*l,F=h[2*d+1]*l;p=(p-w)/n;z=(z-w)/n;D=(D-w)/n;v=(v-k)/x;y=(y-k)/x;F=(F-k)/x;g=d=99999;t=c=-99999;d=Math.min(d,p);d=Math.min(d,z);d=Math.min(d,D);g=Math.min(g,v);g=Math.min(g,y);g=Math.min(g,F);c=Math.max(c,p);c=Math.max(c,z);c=Math.max(c,D);t=Math.max(t,v);t=Math.max(t,y);t=Math.max(t,F);d*=e;c*=e;g*=m;t*=m;d=Math.floor(d)-this.padding;g=Math.floor(g)-this.padding;c=Math.floor(c)+
this.padding;t=Math.floor(t)+this.padding;for(v=g;v<=t;v++)for(p=d;p<=c;p++)q[v*e+p]=255}d=Math.max(e,m);h=[q];a=e;c=m;f=[a];l=[c];for(g=0;8<d;){r=Math.floor(a/2);w=Math.floor(c/2);u=new Uint8Array(r*w);for(v=0;v<w;v++)for(p=0;p<r;p++){for(x=d=0;2>x;x++)for(n=0;2>n;n++)d=Math.max(d,h[g][(2*v+x)*a+(2*p+n)]);u[v*r+p]=d}d=Math.max(r,w);a=r;c=w;g++;h[g]=u;f[g]=r;l[g]=w}k=[];for(a=h.length-1;0<=a;a--)for(r=f[a],w=l[a],u=h[a],z=e/r,y=m/w,v=0;v<w;v++)for(p=0;p<r;p++)if(0===u[v*r+p]){g=Math.floor(p*z);t=
Math.floor(v*y);c=d=g;g=t;for(var D=d,F=g,H=c,I=t,A=!0,B=0,C=!0;A;){if(0>d||0>g||c>e-1||t>m-1)A=!1;else for(x=g;x<=t;x++){for(n=d;n<=c;n++)if(0<q[x*e+n]){A=!1;break}if(!A)break}if(A)for(n=0;n<k.length;n++)if(!(k[n].maxx<d||k[n].minx>c||k[n].maxy<g||k[n].miny>t)){A=!1;break}if(!A){if(C)break;d=D;g=F;c=H;t=I;B++;if(6>B)A=!0;else break}C=!1;D=d;F=g;H=c;I=t;0===B?(g--,d--):1===B?(t++,c++):2===B?d--:3===B?g--:4===B?c++:5===B&&t++}C||k.push({minx:d,miny:g,maxx:c,maxy:t})}for(a=0;a<k.length;a++)q={x:0,y:0,
z:0,w:0},q.x=k[a].minx/e*b.aabb.z+b.aabb.x,q.y=k[a].miny/m*b.aabb.w+b.aabb.y,q.z=(k[a].maxx-k[a].minx)/e*b.aabb.z,q.w=(k[a].maxy-k[a].miny)/m*b.aabb.w,k[a]={aabb:q,id:-1,child:[],leaf:!0};return k},insertToAtlas:function(b,d,e,h,c,f,g,l){if(b.leaf){if(0<=b.id||!this.fits(e,b.aabb))return null;if(this.fitsExactly(e,b.aabb))return b.id=d,this.fillHoles&&(d=this.findHoles(b,d,e,h,c,f,g,l),0<d.length&&(b.leaf=!1,b.child=d,b.insideHole=!0)),b;var a={x:0,y:0,z:0,w:0},m={x:0,y:0,z:0,w:0};b.aabb.z-e.z>b.aabb.w-
e.w?(a.x=b.aabb.x,a.y=b.aabb.y,a.z=e.z,a.w=b.aabb.w,m.x=b.aabb.x+e.z,m.y=b.aabb.y,m.z=b.aabb.z-e.z,m.w=b.aabb.w):(a.x=b.aabb.x,a.y=b.aabb.y,a.z=b.aabb.z,a.w=e.w,m.x=b.aabb.x,m.y=b.aabb.y+e.w,m.z=b.aabb.z,m.w=b.aabb.w-e.w);b.leaf=!1;b.child=[];b.child[0]={aabb:a,id:-1,child:[],leaf:!0,test:!1};b.child[1]={aabb:m,id:-1,child:[],leaf:!0,test:!1};return this.insertToAtlas(b.child[0],d,e,h,c,f,g,l)}for(a=0;a<b.child.length;a++)if(m=this.insertToAtlas(b.child[a],d,e,h,c,f,g,l))return m;return null},transformUv:function(b,
d){b.x=b.x*d.x+d.z;b.y=b.y*d.y+d.w},packCharts:function(b,d,e,h,c,f,g){var l=this.now(),a,m={aabb:{x:0,y:0,z:1,w:1},id:-1,child:[],leaf:!0,test:!1},q=[],u=[];for(a=0;a<d.length;a++)u[a]=a;u.sort(function(a,b){return Math.max(e[b].z*f[b],e[b].w*f[b])-Math.max(e[a].z*f[a],e[a].w*f[a])});for(var r=0,w=0,k=0,n=0,x=99999,p,v=0;v<e.length;v++){a=u[v];p={x:e[a].x,y:e[a].y,z:e[a].z,w:e[a].w};p.x=p.x*f[a]*g;p.y=p.y*f[a]*g;p.z=p.z*f[a]*g;p.w=p.w*f[a]*g;p.z+=2*this.paddingUv;p.w+=2*this.paddingUv;var t=this.insertToAtlas(m,
a,p,c,d,b,e,f[a]*g);if(t)q[a]=t.aabb,t.insideHole||(w+=q[a].z*q[a].w);else if(r+=p.z*p.w,100<r)return console.error("Something went wrong with chart scaling"),!1;k=Math.max(k,p.z);n=Math.max(n,p.w);x=Math.min(x,p.z)}h.usedArea=w;h.maxWidth=k;h.maxHeight=n;h.minWidth=x;if(0<r)return console.log("PackCharts (fail) time: "+(this.now()-l)/1E3+" (can't fit "+r+")"),h.notFitted=r,!1;for(a=0;a<q.length;a++)q[a].z>2*this.paddingUv&&q[a].w>2*this.paddingUv&&(q[a].x+=this.paddingUv,q[a].y+=this.paddingUv,q[a].z-=
2*this.paddingUv,q[a].w-=2*this.paddingUv);b=[];for(a=0;a<e.length;a++)p={x:e[a].x,y:e[a].y,z:e[a].z,w:e[a].w},p.x=p.x*f[a]*g,p.y=p.y*f[a]*g,p.z=p.z*f[a]*g,p.w=p.w*f[a]*g,d=q[a].z/p.z,h=q[a].w/p.w,b.push({x:d,y:h,z:q[a].x-p.x*d,w:q[a].y-p.y*h});console.log("PackCharts (success) time: "+(this.now()-l)/1E3);return{scaleOffset:b,packedAabbs:q}},transformUv2:function(b,d,e,h){b.x=b.x*d*e;b.y=b.y*d*e;return this.transformUv(b,h)},finalTransformUv:function(b,d,e,h,c,f){var g,l,a,m,q,u={x:0,y:0},r={x:0,
y:0},w={x:0,y:0},k=0,n=[];for(g=0;g<d.length;g++){chartTris=d[g];for(l=0;l<chartTris;l++)a=k+l,m=b[3*a],q=b[3*a+1],a=b[3*a+2],u.x=e[2*m],u.y=e[2*m+1],r.x=e[2*q],r.y=e[2*q+1],w.x=e[2*a],w.y=e[2*a+1],n[m]||this.transformUv2(u,h[g],c,f[g]),n[q]||this.transformUv2(r,h[g],c,f[g]),n[a]||this.transformUv2(w,h[g],c,f[g]),e[2*m]=u.x,e[2*m+1]=u.y,e[2*q]=r.x,e[2*q+1]=r.y,e[2*a]=w.x,e[2*a+1]=w.y,n[m]=!0,n[q]=!0,n[a]=!0;k+=chartTris}},unwrapJsonModel:function(b,d,e,h){this.resolution=1024;this.padding=e;this.paddingUv=
this.padding/this.resolution;this.fillHoles=h;var c,f,g,l,a;e=[];var m=[];h=[];var q=[],u=[],r=0,w,k,n,x=[],p=[],v,t,z=.025;a=[];for(c=0;c<b.model.meshInstances.length;c++)if(void 0===a[c])for(a[c]=-1,f=c+1;f<b.model.meshInstances.length;f++)b.model.meshInstances[c].mesh===b.model.meshInstances[f].mesh&&(a[c]=0,a[f]=1);for(c=0;c<b.model.meshInstances.length;c++){a=b.model.meshInstances[c].mesh;f=b.model.meshInstances[c].node;k=b.model.meshes[a].vertices;g=b.model.meshes[a].indices;n=b.model.vertices[k];
l=n.position.data;a=n.texCoord0?n.texCoord0.data:null;w=b.model.nodes[f].scale;d&&(a=null);f={uv:a,append:[]};a||(f=this.boxUnwrap(g,l),a=f.uv);l=f.append;for(v in n)if("position"!==v&&n.hasOwnProperty(v)){var y=n[v].data,D=n[v].components;for(g=0;g<l.length;g++)for(f=0;f<D;f++)y.push(y[l[g]*D+f])}if(x[k])for(t in a)x[k][t]=a[t];else x[k]=a;p[k]=w}for(c=0;c<b.model.vertices.length;c++){n=b.model.vertices[c];l=n.position.data;a=x[c];w=p[c];u[c]=l.length/3;for(f=0;f<l.length/3;f++)m.push(l[3*f]*w[0]),
m.push(l[3*f+1]*w[1]),m.push(l[3*f+2]*w[2]);for(f=0;f<a.length;f++)h.push(a[f]);q[c]=r;r+=l.length/3}for(c=0;c<b.model.meshInstances.length;c++)for(a=b.model.meshInstances[c].mesh,k=b.model.meshes[a].vertices,g=b.model.meshes[a].indices,f=0;f<g.length;f++)e.push(g[f]+q[k]);v=this.findCharts(e);t=this.calculateChartArea(e,v,m,h);c=this.normalizeCharts(e,v,t,h);for(m=1;;){d=this.packCharts(e,v,t.aabbs,t,h,c,m);r=d.scaleOffset;if(!r)break;m+=z;if(100<m){console.error("Failed to unwrap");return}console.log("grow "+
m)}for(z=-.025;;){m+=z;if(0>m){if(1>this.padding){console.error("Failed to unwrap");return}this.padding*=.5;this.paddingUv*=.5;m=1;console.warn("Reducing padding to "+this.padding)}console.log("shrink "+m);d=this.packCharts(e,v,t.aabbs,t,h,c,m);if(r=d.scaleOffset)break}this.finalTransformUv(e,v,h,c,m,r);for(c=0;c<b.model.vertices.length;c++){a=[];for(f=0;f<2*u[c];f++)a.push(h[2*q[c]+f]);n=b.model.vertices[c];n.texCoord1={data:a,components:2,type:"float32"}}return d.packedAabbs}};
