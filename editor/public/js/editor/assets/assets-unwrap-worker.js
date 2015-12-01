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
            unwrap.progress = function(p) {
                console.log('unwrap', p);
            };
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
Unwrap.prototype={now:performance.now&&performance.timing?function(){return performance.now()}:Date.now,swap:function(b,c,e){var h=b[c];b[c]=b[e];b[e]=h},crossNormalize:function(b,c){var e=b.y*c.z-b.z*c.y,h=b.z*c.x-b.x*c.z,d=b.x*c.y-b.y*c.x,f=Math.sqrt(e*e+h*h+d*d);return{x:e/f,y:h/f,z:d/f}},triNormal:function(b,c,e,h,d,f,g,l,a){b-=h;c-=d;e-=f;h-=g;d-=l;a=f-a;f=c*a-e*d;a=e*h-b*a;b=b*d-c*h;c=Math.sqrt(f*f+a*a+b*b);return{x:f/c,y:a/c,z:b/c}},cubeFaceFromNormal:function(b){var c=Math.abs(b.x),e=Math.abs(b.y),
h=Math.abs(b.z);return c>=e&&c>=h?0>b.x?0:1:e>=c&&e>=h?0>b.y?2:3:0>b.z?4:5},boxUnwrap:function(b,c){var e=this.now(),h=c.length/3,d,f,g,l,a,m,q,v,r,w=0,k;d=0;var n=[];for(k=0;6>k;k++)n[k]=[];for(k=0;k<b.length;k+=3)d=c[3*b[k]],f=c[3*b[k]+1],g=c[3*b[k]+2],l=c[3*b[k+1]],a=c[3*b[k+1]+1],m=c[3*b[k+1]+2],q=c[3*b[k+2]],v=c[3*b[k+2]+1],r=c[3*b[k+2]+2],d=this.triNormal(d,f,g,l,a,m,q,v,r),d=this.cubeFaceFromNormal(d),n[d].push(b[k]),n[d].push(b[k+1]),n[d].push(b[k+2]);for(k=1;6>k;k++);f=[];a=[];for(l=0;6>
l;l++)for(d=l+1;6>d;d++)for(k=0;k<n[l].length;k++){f=[];for(j=0;j<n[d].length;j++)n[l][k]===n[d][j]&&f.push(j);if(0<f.length){for(j=0;j<f.length;j++)n[d][f[j]]=h;a.push(n[l][k]);h++;w++}}for(k=0;k<w;k++)c.push(c[3*a[k]]),c.push(c[3*a[k]+1]),c.push(c[3*a[k]+2]);h=[];m=[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];for(l=offset=0;6>l;l++)for(k=m[l],q=this.crossNormalize(k,.5<Math.abs(k.y)?{x:1,y:0,z:0}:{x:0,y:1,z:0}),v=this.crossNormalize(k,q),q=this.crossNormalize(k,
v),k=0;k<n[l].length;k++)b[offset]=n[l][k],d=c[3*b[offset]],f=c[3*b[offset]+1],g=c[3*b[offset]+2],h[2*b[offset]]=q.x*d+q.y*f+q.z*g,h[2*b[offset]+1]=v.x*d+v.y*f+v.z*g,offset++;console.log("BoxUnwrap time: "+(this.now()-e)/1E3);console.log("Added "+w+" verts");return{append:a,uv:h}},findCharts:function(b){var c=this.now(),e,h,d,f=[],g=0,l;for(e=0;e<b.length;e++){d=3*Math.floor(e/3);g=Math.max(d,g);0===e%3&&(l=3);for(h=g;h<b.length;h++)b[e]===b[h]&&(h=3*Math.floor(h/3),this.swap(b,g,h),this.swap(b,g+
1,h+1),this.swap(b,g+2,h+2),h+=2,g+=3,l--);2===e%3&&3>l&&(0<f.length&&f[f.length-1]>d?f[f.length-1]=g:f.push(g))}for(e=b=0;e<f.length;e++)f[e]=(f[e]-3*b)/3,b+=f[e];console.log("FindCharts time: "+(this.now()-c)/1E3);console.log("Found "+f.length+" charts");return f},triangleArea:function(b,c,e,h,d,f,g,l,a){h-=b;d-=c;f-=e;g-=b;l-=c;a-=e;b=d*a-f*l;f=f*g-h*a;h=h*l-d*g;return.5*Math.sqrt(b*b+f*f+h*h)},calculateChartArea:function(b,c,e,h){var d,f,g,l,a,m,q,v,r,w,k,n,x,p,u,t=0,A,B,E=[],F=[],H=0,I=0,y,z,
C,D,G=[];for(d=0;d<c.length;d++){g=c[d];B=A=0;y=z=99999;C=D=-99999;for(f=0;f<g;f++)l=t+f,a=b[3*l],m=b[3*l+1],l=b[3*l+2],q=e[3*a],v=e[3*a+1],r=e[3*a+2],w=e[3*m],k=e[3*m+1],n=e[3*m+2],x=e[3*l],p=e[3*l+1],u=e[3*l+2],A+=this.triangleArea(q,v,r,w,k,n,x,p,u),q=h[2*a],a=h[2*a+1],v=h[2*m],m=h[2*m+1],r=h[2*l],l=h[2*l+1],B+=this.triangleArea(q,a,0,v,m,0,r,l,0),y=Math.min(y,q),y=Math.min(y,v),y=Math.min(y,r),z=Math.min(z,a),z=Math.min(z,m),z=Math.min(z,l),C=Math.max(C,q),C=Math.max(C,v),C=Math.max(C,r),D=Math.max(D,
a),D=Math.max(D,m),D=Math.max(D,l);0===A&&(console.warn("Zero area"),B=A=.01,C=y+.01,D=z+.01);isNaN(A)&&(console.warn("NaN area"),B=A=.01,C=y+.01,D=z+.01);0===B&&(console.warn("Zero UV area"),B=.01,C=y+.01,D=z+.01);H+=A;E.push(A);t+=g;G[d]={x:0,y:0,z:0,w:0};G[d].x=y;G[d].y=z;G[d].z=C-G[d].x;G[d].w=D-G[d].y;I+=B;F.push(B)}return{areas:E,areasT:F,totalArea:H,totalAreaT:I,aabbs:G}},normalizeCharts:function(b,c,e,h,d,f){b=e.areas;h=e.areasT;f=e.totalArea;var g=[];for(e=0;e<c.length;e++)d=.8*Math.sqrt(1/
h[e]*(b[e]/f)),g.push(d);return g},fits:function(b,c){return b.z<=c.z&&b.w<=c.w},fitsExactly:function(b,c){return b.z===c.z&&b.w===c.w},findHoles:function(b,c,e,h,d,f,g,l){var a;e=Math.floor((b.aabb.z*this.resolution-2*this.padding)/4);var m=Math.floor((b.aabb.w*this.resolution-2*this.padding)/4);if(0>=e||0>=m)return[];var q=new Uint8Array(e*m),v=0;for(a=0;a<d.length&&a!==c;a++)v+=d[a];var r=d[c],w=g[c].x*l,k=g[c].y*l,n=g[c].z*l,x=g[c].w*l,p,u,t;for(a=0;a<r;a++){d=f[3*(v+a)];g=f[3*(v+a)+1];c=f[3*
(v+a)+2];p=h[2*d]*l;u=h[2*d+1]*l;var A=h[2*g]*l,B=h[2*g+1]*l,E=h[2*c]*l,F=h[2*c+1]*l;p=(p-w)/n;A=(A-w)/n;E=(E-w)/n;u=(u-k)/x;B=(B-k)/x;F=(F-k)/x;g=c=99999;t=d=-99999;c=Math.min(c,p);c=Math.min(c,A);c=Math.min(c,E);g=Math.min(g,u);g=Math.min(g,B);g=Math.min(g,F);d=Math.max(d,p);d=Math.max(d,A);d=Math.max(d,E);t=Math.max(t,u);t=Math.max(t,B);t=Math.max(t,F);c*=e;d*=e;g*=m;t*=m;c=Math.floor(c)-this.padding;g=Math.floor(g)-this.padding;d=Math.floor(d)+this.padding;t=Math.floor(t)+this.padding;for(u=g;u<=
t;u++)for(p=c;p<=d;p++)q[u*e+p]=255}c=Math.max(e,m);h=[q];a=e;d=m;f=[a];l=[d];for(g=0;8<c;){r=Math.floor(a/2);w=Math.floor(d/2);v=new Uint8Array(r*w);for(u=0;u<w;u++)for(p=0;p<r;p++){for(x=c=0;2>x;x++)for(n=0;2>n;n++)c=Math.max(c,h[g][(2*u+x)*a+(2*p+n)]);v[u*r+p]=c}c=Math.max(r,w);a=r;d=w;g++;h[g]=v;f[g]=r;l[g]=w}k=[];for(a=h.length-1;0<=a;a--)for(r=f[a],w=l[a],v=h[a],A=e/r,B=m/w,u=0;u<w;u++)for(p=0;p<r;p++)if(0===v[u*r+p]){g=Math.floor(p*A);t=Math.floor(u*B);d=c=g;g=t;for(var E=c,F=g,H=d,I=t,y=!0,
z=0,C=!0;y;){if(0>c||0>g||d>e-1||t>m-1)y=!1;else for(x=g;x<=t;x++){for(n=c;n<=d;n++)if(0<q[x*e+n]){y=!1;break}if(!y)break}if(y)for(n=0;n<k.length;n++)if(!(k[n].maxx<c||k[n].minx>d||k[n].maxy<g||k[n].miny>t)){y=!1;break}if(!y){if(C)break;c=E;g=F;d=H;t=I;z++;if(6>z)y=!0;else break}C=!1;E=c;F=g;H=d;I=t;0===z?(g--,c--):1===z?(t++,d++):2===z?c--:3===z?g--:4===z?d++:5===z&&t++}C||k.push({minx:c,miny:g,maxx:d,maxy:t})}for(a=0;a<k.length;a++)q={x:0,y:0,z:0,w:0},q.x=k[a].minx/e*b.aabb.z+b.aabb.x,q.y=k[a].miny/
m*b.aabb.w+b.aabb.y,q.z=(k[a].maxx-k[a].minx)/e*b.aabb.z,q.w=(k[a].maxy-k[a].miny)/m*b.aabb.w,k[a]={aabb:q,id:-1,child:[],leaf:!0,insideHole:!0};return k},insertToAtlas:function(b,c,e,h,d,f,g,l){if(b.leaf){if(0<=b.id||!this.fits(e,b.aabb))return null;if(this.fitsExactly(e,b.aabb))return b.id=c,this.fillHoles&&(c=this.findHoles(b,c,e,h,d,f,g,l),0<c.length&&(b.leaf=!1,b.child=c)),b;var a={x:0,y:0,z:0,w:0},m={x:0,y:0,z:0,w:0};b.aabb.z-e.z>b.aabb.w-e.w?(a.x=b.aabb.x,a.y=b.aabb.y,a.z=e.z,a.w=b.aabb.w,
m.x=b.aabb.x+e.z,m.y=b.aabb.y,m.z=b.aabb.z-e.z,m.w=b.aabb.w):(a.x=b.aabb.x,a.y=b.aabb.y,a.z=b.aabb.z,a.w=e.w,m.x=b.aabb.x,m.y=b.aabb.y+e.w,m.z=b.aabb.z,m.w=b.aabb.w-e.w);b.leaf=!1;b.child=[];b.child[0]={aabb:a,id:-1,child:[],leaf:!0,test:!1};b.child[1]={aabb:m,id:-1,child:[],leaf:!0,test:!1};return this.insertToAtlas(b.child[0],c,e,h,d,f,g,l)}for(a=0;a<b.child.length;a++)if(m=this.insertToAtlas(b.child[a],c,e,h,d,f,g,l))return m;return null},transformUv:function(b,c){b.x=b.x*c.x+c.z;b.y=b.y*c.y+c.w},
packCharts:function(b,c,e,h,d,f,g){var l=this.now(),a,m={aabb:{x:0,y:0,z:1,w:1},id:-1,child:[],leaf:!0,test:!1},q=[],v=[];for(a=0;a<c.length;a++)v[a]=a;v.sort(function(a,b){return Math.max(e[b].z*f[b],e[b].w*f[b])-Math.max(e[a].z*f[a],e[a].w*f[a])});for(var r=0,w=0,k=0,n=0,x=99999,p,u=0;u<e.length;u++){a=v[u];p={x:e[a].x,y:e[a].y,z:e[a].z,w:e[a].w};p.x=p.x*f[a]*g;p.y=p.y*f[a]*g;p.z=p.z*f[a]*g;p.w=p.w*f[a]*g;p.z+=2*this.paddingUv;p.w+=2*this.paddingUv;var t=this.insertToAtlas(m,a,p,d,c,b,e,f[a]*g);
t?(q[a]=t.aabb,t.insideHole||(w+=q[a].z*q[a].w)):r+=p.z*p.w;k=Math.max(k,p.z);n=Math.max(n,p.w);x=Math.min(x,p.z)}h.usedArea=w;h.maxWidth=k;h.maxHeight=n;h.minWidth=x;if(0<r)return console.log("PackCharts (fail) time: "+(this.now()-l)/1E3+" (can't fit "+r+")"),h.notFitted=r,!1;for(a=0;a<q.length;a++)q[a].z>2*this.paddingUv&&q[a].w>2*this.paddingUv&&(q[a].x+=this.paddingUv,q[a].y+=this.paddingUv,q[a].z-=2*this.paddingUv,q[a].w-=2*this.paddingUv);b=[];for(a=0;a<e.length;a++)p={x:e[a].x,y:e[a].y,z:e[a].z,
w:e[a].w},p.x=p.x*f[a]*g,p.y=p.y*f[a]*g,p.z=p.z*f[a]*g,p.w=p.w*f[a]*g,c=q[a].z/p.z,h=q[a].w/p.w,b.push({x:c,y:h,z:q[a].x-p.x*c,w:q[a].y-p.y*h});console.log("PackCharts (success) time: "+(this.now()-l)/1E3);return{scaleOffset:b,packedAabbs:q}},transformUv2:function(b,c,e,h){b.x=b.x*c*e;b.y=b.y*c*e;return this.transformUv(b,h)},finalTransformUv:function(b,c,e,h,d,f){var g,l,a,m,q,v={x:0,y:0},r={x:0,y:0},w={x:0,y:0},k=0,n=[];for(g=0;g<c.length;g++){chartTris=c[g];for(l=0;l<chartTris;l++)a=k+l,m=b[3*
a],q=b[3*a+1],a=b[3*a+2],v.x=e[2*m],v.y=e[2*m+1],r.x=e[2*q],r.y=e[2*q+1],w.x=e[2*a],w.y=e[2*a+1],n[m]||this.transformUv2(v,h[g],d,f[g]),n[q]||this.transformUv2(r,h[g],d,f[g]),n[a]||this.transformUv2(w,h[g],d,f[g]),e[2*m]=v.x,e[2*m+1]=v.y,e[2*q]=r.x,e[2*q+1]=r.y,e[2*a]=w.x,e[2*a+1]=w.y,n[m]=!0,n[q]=!0,n[a]=!0;k+=chartTris}},unwrapJsonModel:function(b,c,e,h){this.resolution=1024;this.padding=e;this.paddingUv=this.padding/this.resolution;this.fillHoles=h;var d,f,g,l,a;e=[];var m=[];h=[];var q=[],v=[],
r=0,w,k,n,x=[],p=[],u,t;d=.025;a=[];for(d=0;d<b.model.meshInstances.length;d++)if(void 0===a[d])for(a[d]=-1,f=d+1;f<b.model.meshInstances.length;f++)b.model.meshInstances[d].mesh===b.model.meshInstances[f].mesh&&(a[d]=0,a[f]=1);for(d=0;d<b.model.meshInstances.length;d++){this.progress&&this.progress(d/b.model.meshInstances.length*30);if(this.cancel)return;a=b.model.meshInstances[d].mesh;f=b.model.meshInstances[d].node;k=b.model.meshes[a].vertices;g=b.model.meshes[a].indices;n=b.model.vertices[k];
l=n.position.data;a=n.texCoord0?n.texCoord0.data:null;w=b.model.nodes[f].scale;c&&(a=null);f={uv:a,append:[]};a||(f=this.boxUnwrap(g,l),a=f.uv);l=f.append;for(u in n)if("position"!==u&&n.hasOwnProperty(u)){var A=n[u].data,B=n[u].components;for(g=0;g<l.length;g++)for(f=0;f<B;f++)A.push(A[l[g]*B+f])}if(x[k])for(t in a)x[k][t]=a[t];else x[k]=a;p[k]=w}for(d=0;d<b.model.vertices.length;d++){n=b.model.vertices[d];l=n.position.data;a=x[d];w=p[d];v[d]=l.length/3;for(f=0;f<l.length/3;f++)m.push(l[3*f]*w[0]),
m.push(l[3*f+1]*w[1]),m.push(l[3*f+2]*w[2]);for(f=0;f<a.length;f++)h.push(a[f]);q[d]=r;r+=l.length/3}for(d=0;d<b.model.meshInstances.length;d++)for(a=b.model.meshInstances[d].mesh,k=b.model.meshes[a].vertices,g=b.model.meshes[a].indices,f=0;f<g.length;f++)e.push(g[f]+q[k]);u=this.findCharts(e);r=this.calculateChartArea(e,u,m,h);t=this.normalizeCharts(e,u,r,h);m=1;if(!this.cancel){c=this.packCharts(e,u,r.aabbs,r,h,t,m);for(this.progress&&this.progress(30);!c;){if(this.cancel)return;m/=1+r.notFitted;
console.log("divide "+m);c=this.packCharts(e,u,r.aabbs,r,h,t,m)}for(this.progress&&this.progress(50);;){if(this.cancel)return;console.log("Used area: "+r.usedArea);d=(1-r.usedArea)/5;c=m;m+=d;if(m===c)break;console.log("grow "+m);c=this.packCharts(e,u,r.aabbs,r,h,t,m);if(!c)break}this.progress&&this.progress(90);m-=d;c=this.packCharts(e,u,r.aabbs,r,h,t,m);d=c.scaleOffset;this.finalTransformUv(e,u,h,t,m,d);for(d=0;d<b.model.vertices.length;d++){a=[];for(f=0;f<2*v[d];f++)a.push(h[2*q[d]+f]);n=b.model.vertices[d];
n.texCoord1={data:a,components:2,type:"float32"}}this.progress&&this.progress(100);return c.packedAabbs}}};
