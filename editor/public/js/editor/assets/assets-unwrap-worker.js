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
        case 'area':
            area(evt.data.id, evt.data.filename);
            break;
    };
};

var loadFile = function(id, filename, fn) {
    var job = { };

    job.xhr = new XMLHttpRequest();

    job.xhr.addEventListener('load', function() {
        try {
            var data = JSON.parse(this.responseText);
            fn(null, data);
        } catch(e) {
            fn(e);
        }
    });
    job.xhr.addEventListener('error', function() {
        fn(e);
    });

    job.xhr.open('GET', '/api/files/assets/' + id + '/1/' + filename, true);
    job.xhr.send(null);

    return job;
};

var start = function(id, filename) {
    jobs[id] = loadFile(id, filename, function(err, data) {
        if (err) {
            postMessage({
                name: 'error',
                id: id,
                err: err.message,
                stack: err.stack.split('\n')
            });
            abort(id);
        } else {
            var unwrap = new Unwrap();
            unwrap.progress = function(p) {
                console.log('unwrap', p);
            };
            var result = unwrap.unwrapJsonModel(data, true, 2, true);

            postMessage({
                name: 'finish',
                id: id,
                data: data,
                area: result.totalArea
            });
            delete job[id];
        }
    });

    postMessage('started ' + id);
};

var abort = function(id) {
    if (! jobs[id])
        return;

    delete jobs[id];
};

var area = function(id, filename) {
    jobs[id] = loadFile(id, filename, function(err, data) {
        if (err) {
            postMessage({
                name: 'error',
                id: id,
                err: err.message,
                stack: err.stack.split('\n')
            });
            abort(id);
        } else {
            var unwrap = new Unwrap();
            var area = unwrap.calculateAreaOfJsonModel(data);

            postMessage({
                name: 'finish',
                id: id,
                area: area
            });
            delete job[id];
        }
    });

    postMessage('started area ' + id);
};

var Unwrap=function(){};
Unwrap.prototype={now:performance.now&&performance.timing?function(){return performance.now()}:Date.now,swap:function(a,c,e){var h=a[c];a[c]=a[e];a[e]=h},crossNormalize:function(a,c){var e=a.y*c.z-a.z*c.y,h=a.z*c.x-a.x*c.z,d=a.x*c.y-a.y*c.x,f=Math.sqrt(e*e+h*h+d*d);return{x:e/f,y:h/f,z:d/f}},triNormal:function(a,c,e,h,d,f,g,l,b){a-=h;c-=d;e-=f;h-=g;d-=l;b=f-b;f=c*b-e*d;b=e*h-a*b;a=a*d-c*h;c=Math.sqrt(f*f+b*b+a*a);return{x:f/c,y:b/c,z:a/c}},cubeFaceFromNormal:function(a){var c=Math.abs(a.x),e=Math.abs(a.y),
h=Math.abs(a.z);return c>=e&&c>=h?0>a.x?0:1:e>=c&&e>=h?0>a.y?2:3:0>a.z?4:5},boxUnwrap:function(a,c){var e=this.now(),h=c.length/3,d,f,g,l,b,m,n,u,r,v=0,k;d=0;var p=[];for(k=0;6>k;k++)p[k]=[];for(k=0;k<a.length;k+=3)d=c[3*a[k]],f=c[3*a[k]+1],g=c[3*a[k]+2],l=c[3*a[k+1]],b=c[3*a[k+1]+1],m=c[3*a[k+1]+2],n=c[3*a[k+2]],u=c[3*a[k+2]+1],r=c[3*a[k+2]+2],d=this.triNormal(d,f,g,l,b,m,n,u,r),d=this.cubeFaceFromNormal(d),p[d].push(a[k]),p[d].push(a[k+1]),p[d].push(a[k+2]);for(k=1;6>k;k++);f=[];b=[];for(l=0;6>
l;l++)for(d=l+1;6>d;d++)for(k=0;k<p[l].length;k++){f=[];for(j=0;j<p[d].length;j++)p[l][k]===p[d][j]&&f.push(j);if(0<f.length){for(j=0;j<f.length;j++)p[d][f[j]]=h;b.push(p[l][k]);h++;v++}}for(k=0;k<v;k++)c.push(c[3*b[k]]),c.push(c[3*b[k]+1]),c.push(c[3*b[k]+2]);h=[];m=[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];for(l=offset=0;6>l;l++)for(k=m[l],n=this.crossNormalize(k,.5<Math.abs(k.y)?{x:1,y:0,z:0}:{x:0,y:1,z:0}),u=this.crossNormalize(k,n),n=this.crossNormalize(k,
u),k=0;k<p[l].length;k++)a[offset]=p[l][k],d=c[3*a[offset]],f=c[3*a[offset]+1],g=c[3*a[offset]+2],h[2*a[offset]]=n.x*d+n.y*f+n.z*g,h[2*a[offset]+1]=u.x*d+u.y*f+u.z*g,offset++;console.log("BoxUnwrap time: "+(this.now()-e)/1E3);console.log("Added "+v+" verts");return{append:b,uv:h}},findCharts:function(a){var c=this.now(),e,h,d,f=[],g=0,l;for(e=0;e<a.length;e++){d=3*Math.floor(e/3);g=Math.max(d,g);0===e%3&&(l=3);for(h=g;h<a.length;h++)a[e]===a[h]&&(h=3*Math.floor(h/3),this.swap(a,g,h),this.swap(a,g+
1,h+1),this.swap(a,g+2,h+2),h+=2,g+=3,l--);2===e%3&&3>l&&(0<f.length&&f[f.length-1]>d?f[f.length-1]=g:f.push(g))}for(e=a=0;e<f.length;e++)f[e]=(f[e]-3*a)/3,a+=f[e];console.log("FindCharts time: "+(this.now()-c)/1E3);console.log("Found "+f.length+" charts");return f},triangleArea:function(a,c,e,h,d,f,g,l,b){h-=a;d-=c;f-=e;g-=a;l-=c;b-=e;a=d*b-f*l;f=f*g-h*b;h=h*l-d*g;return.5*Math.sqrt(a*a+f*f+h*h)},calculateChartArea:function(a,c,e,h){var d,f,g,l,b,m,n,u,r,v,k,p,x,q,w,t=0,A,B,E=[],F=[],H=0,I=0,y,z,
C,D,G=[];for(d=0;d<c.length;d++){g=c[d];B=A=0;y=z=99999;C=D=-99999;for(f=0;f<g;f++)l=t+f,b=a[3*l],m=a[3*l+1],l=a[3*l+2],n=e[3*b],u=e[3*b+1],r=e[3*b+2],v=e[3*m],k=e[3*m+1],p=e[3*m+2],x=e[3*l],q=e[3*l+1],w=e[3*l+2],A+=this.triangleArea(n,u,r,v,k,p,x,q,w),n=h[2*b],b=h[2*b+1],u=h[2*m],m=h[2*m+1],r=h[2*l],l=h[2*l+1],B+=this.triangleArea(n,b,0,u,m,0,r,l,0),y=Math.min(y,n),y=Math.min(y,u),y=Math.min(y,r),z=Math.min(z,b),z=Math.min(z,m),z=Math.min(z,l),C=Math.max(C,n),C=Math.max(C,u),C=Math.max(C,r),D=Math.max(D,
b),D=Math.max(D,m),D=Math.max(D,l);0===A&&(console.warn("Zero area"),B=A=.01,C=y+.01,D=z+.01);isNaN(A)&&(console.warn("NaN area"),B=A=.01,C=y+.01,D=z+.01);0===B&&(console.warn("Zero UV area"),B=.01,C=y+.01,D=z+.01);H+=A;E.push(A);t+=g;G[d]={x:0,y:0,z:0,w:0};G[d].x=y;G[d].y=z;G[d].z=C-G[d].x;G[d].w=D-G[d].y;I+=B;F.push(B)}return{areas:E,areasT:F,totalArea:H,totalAreaT:I,aabbs:G}},normalizeCharts:function(a,c,e,h,d,f){a=e.areas;h=e.areasT;f=e.totalArea;var g=[];for(e=0;e<c.length;e++)d=.8*Math.sqrt(1/
h[e]*(a[e]/f)),g.push(d);return g},fits:function(a,c){return a.z<=c.z&&a.w<=c.w},fitsExactly:function(a,c){return a.z===c.z&&a.w===c.w},findHoles:function(a,c,e,h,d,f,g,l){var b;e=Math.floor((a.aabb.z*this.resolution-2*this.padding)/4);var m=Math.floor((a.aabb.w*this.resolution-2*this.padding)/4);if(0>=e||0>=m)return[];if(1E3<e||1E3<m)return console.log("findHoles error"),[];var n=new Uint8Array(e*m),u=0;for(b=0;b<d.length&&b!==c;b++)u+=d[b];var r=d[c],v=g[c].x*l,k=g[c].y*l,p=g[c].z*l,x=g[c].w*l,
q,w,t;for(b=0;b<r;b++){d=f[3*(u+b)];g=f[3*(u+b)+1];c=f[3*(u+b)+2];q=h[2*d]*l;w=h[2*d+1]*l;var A=h[2*g]*l,B=h[2*g+1]*l,E=h[2*c]*l,F=h[2*c+1]*l;q=(q-v)/p;A=(A-v)/p;E=(E-v)/p;w=(w-k)/x;B=(B-k)/x;F=(F-k)/x;g=c=99999;t=d=-99999;c=Math.min(c,q);c=Math.min(c,A);c=Math.min(c,E);g=Math.min(g,w);g=Math.min(g,B);g=Math.min(g,F);d=Math.max(d,q);d=Math.max(d,A);d=Math.max(d,E);t=Math.max(t,w);t=Math.max(t,B);t=Math.max(t,F);c*=e;d*=e;g*=m;t*=m;c=Math.floor(c)-this.padding;g=Math.floor(g)-this.padding;d=Math.floor(d)+
this.padding;t=Math.floor(t)+this.padding;0>c&&(c=0);c>=e&&(c=e-1);0>g&&(g=0);g>=m&&(g=m-1);0>d&&(d=0);d>=e&&(d=e-1);0>t&&(t=0);t>=m&&(t=m-1);for(w=g;w<=t;w++)for(q=c;q<=d;q++)n[w*e+q]=255}c=Math.max(e,m);h=[n];b=e;d=m;f=[b];l=[d];for(g=0;8<c;){r=Math.floor(b/2);v=Math.floor(d/2);u=new Uint8Array(r*v);for(w=0;w<v;w++)for(q=0;q<r;q++){for(x=c=0;2>x;x++)for(p=0;2>p;p++)c=Math.max(c,h[g][(2*w+x)*b+(2*q+p)]);u[w*r+q]=c}c=Math.max(r,v);b=r;d=v;g++;h[g]=u;f[g]=r;l[g]=v}k=[];for(b=h.length-1;0<=b;b--)for(r=
f[b],v=l[b],u=h[b],A=e/r,B=m/v,w=0;w<v;w++)for(q=0;q<r;q++)if(0===u[w*r+q]){g=Math.floor(q*A);t=Math.floor(w*B);d=c=g;g=t;for(var E=c,F=g,H=d,I=t,y=!0,z=0,C=!0;y;){if(0>c||0>g||d>e-1||t>m-1)y=!1;else for(x=g;x<=t;x++){for(p=c;p<=d;p++)if(0<n[x*e+p]){y=!1;break}if(!y)break}if(y)for(p=0;p<k.length;p++)if(!(k[p].maxx<c||k[p].minx>d||k[p].maxy<g||k[p].miny>t)){y=!1;break}if(!y){if(C)break;c=E;g=F;d=H;t=I;z++;if(6>z)y=!0;else break}C=!1;E=c;F=g;H=d;I=t;0===z?(g--,c--):1===z?(t++,d++):2===z?c--:3===z?g--:
4===z?d++:5===z&&t++}C||k.push({minx:c,miny:g,maxx:d,maxy:t})}for(b=0;b<k.length;b++)n={x:0,y:0,z:0,w:0},n.x=k[b].minx/e*a.aabb.z+a.aabb.x,n.y=k[b].miny/m*a.aabb.w+a.aabb.y,n.z=(k[b].maxx-k[b].minx)/e*a.aabb.z,n.w=(k[b].maxy-k[b].miny)/m*a.aabb.w,k[b]={aabb:n,id:-1,child:[],leaf:!0,insideHole:!0};return k},insertToAtlas:function(a,c,e,h,d,f,g,l){if(a.leaf){if(0<=a.id||!this.fits(e,a.aabb))return null;if(this.fitsExactly(e,a.aabb))return a.id=c,this.fillHoles&&(c=this.findHoles(a,c,e,h,d,f,g,l),0<
c.length&&(a.leaf=!1,a.child=c)),a;var b={x:0,y:0,z:0,w:0},m={x:0,y:0,z:0,w:0};a.aabb.z-e.z>a.aabb.w-e.w?(b.x=a.aabb.x,b.y=a.aabb.y,b.z=e.z,b.w=a.aabb.w,m.x=a.aabb.x+e.z,m.y=a.aabb.y,m.z=a.aabb.z-e.z,m.w=a.aabb.w):(b.x=a.aabb.x,b.y=a.aabb.y,b.z=a.aabb.z,b.w=e.w,m.x=a.aabb.x,m.y=a.aabb.y+e.w,m.z=a.aabb.z,m.w=a.aabb.w-e.w);a.leaf=!1;a.child=[];a.child[0]={aabb:b,id:-1,child:[],leaf:!0,test:!1};a.child[1]={aabb:m,id:-1,child:[],leaf:!0,test:!1};return this.insertToAtlas(a.child[0],c,e,h,d,f,g,l)}for(b=
0;b<a.child.length;b++)if(m=this.insertToAtlas(a.child[b],c,e,h,d,f,g,l))return m;return null},transformUv:function(a,c){a.x=a.x*c.x+c.z;a.y=a.y*c.y+c.w},packCharts:function(a,c,e,h,d,f,g){var l=this.now(),b,m={aabb:{x:0,y:0,z:1,w:1},id:-1,child:[],leaf:!0,test:!1},n=[],u=[];for(b=0;b<c.length;b++)u[b]=b;u.sort(function(a,b){return Math.max(e[b].z*f[b],e[b].w*f[b])-Math.max(e[a].z*f[a],e[a].w*f[a])});for(var r=0,v=0,k=0,p=0,x=99999,q,w=0;w<e.length;w++){b=u[w];q={x:e[b].x,y:e[b].y,z:e[b].z,w:e[b].w};
q.x=q.x*f[b]*g;q.y=q.y*f[b]*g;q.z=q.z*f[b]*g;q.w=q.w*f[b]*g;q.z+=2*this.paddingUv;q.w+=2*this.paddingUv;var t=this.insertToAtlas(m,b,q,d,c,a,e,f[b]*g);t?(n[b]=t.aabb,t.insideHole||(v+=n[b].z*n[b].w)):r+=q.z*q.w;k=Math.max(k,q.z);p=Math.max(p,q.w);x=Math.min(x,q.z)}h.usedArea=v;h.maxWidth=k;h.maxHeight=p;h.minWidth=x;if(0<r)return console.log("PackCharts (fail) time: "+(this.now()-l)/1E3+" (can't fit "+r+")"),h.notFitted=r,!1;for(b=0;b<n.length;b++)n[b].z>2*this.paddingUv&&n[b].w>2*this.paddingUv&&
(n[b].x+=this.paddingUv,n[b].y+=this.paddingUv,n[b].z-=2*this.paddingUv,n[b].w-=2*this.paddingUv);a=[];for(b=0;b<e.length;b++)q={x:e[b].x,y:e[b].y,z:e[b].z,w:e[b].w},q.x=q.x*f[b]*g,q.y=q.y*f[b]*g,q.z=q.z*f[b]*g,q.w=q.w*f[b]*g,c=n[b].z/q.z,h=n[b].w/q.w,a.push({x:c,y:h,z:n[b].x-q.x*c,w:n[b].y-q.y*h});console.log("PackCharts (success) time: "+(this.now()-l)/1E3);return{scaleOffset:a,packedAabbs:n}},transformUv2:function(a,c,e,h){a.x=a.x*c*e;a.y=a.y*c*e;return this.transformUv(a,h)},finalTransformUv:function(a,
c,e,h,d,f){var g,l,b,m,n,u={x:0,y:0},r={x:0,y:0},v={x:0,y:0},k=0,p=[];for(g=0;g<c.length;g++){chartTris=c[g];for(l=0;l<chartTris;l++)b=k+l,m=a[3*b],n=a[3*b+1],b=a[3*b+2],u.x=e[2*m],u.y=e[2*m+1],r.x=e[2*n],r.y=e[2*n+1],v.x=e[2*b],v.y=e[2*b+1],p[m]||this.transformUv2(u,h[g],d,f[g]),p[n]||this.transformUv2(r,h[g],d,f[g]),p[b]||this.transformUv2(v,h[g],d,f[g]),e[2*m]=u.x,e[2*m+1]=u.y,e[2*n]=r.x,e[2*n+1]=r.y,e[2*b]=v.x,e[2*b+1]=v.y,p[m]=!0,p[n]=!0,p[b]=!0;k+=chartTris}},totalObjectScale:function(a,c){for(var e=
a.nodes[c].scale,h=e[0],d=e[1],e=e[2],f=a.parents[c],g;0<=f;)g=a.nodes[f].scale,h*=g[0],d*=g[1],e*=g[2],f=a.parents[f];return[h,d,e]},unwrapJsonModel:function(a,c,e,h){this.resolution=1024;this.padding=e;this.paddingUv=this.padding/this.resolution;this.fillHoles=h;var d,f,g,l,b;e=[];var m=[];h=[];var n=[],u=[],r=0,v,k,p,x=[],q=[],w,t;d=.025;b=[];for(d=0;d<a.model.meshInstances.length;d++)if(void 0===b[d])for(b[d]=-1,f=d+1;f<a.model.meshInstances.length;f++)a.model.meshInstances[d].mesh===a.model.meshInstances[f].mesh&&
(b[d]=0,b[f]=1);for(d=0;d<a.model.meshInstances.length;d++){this.progress&&this.progress(d/a.model.meshInstances.length*30);if(this.cancel)return;b=a.model.meshInstances[d].mesh;f=a.model.meshInstances[d].node;k=a.model.meshes[b].vertices;g=a.model.meshes[b].indices;p=a.model.vertices[k];l=p.position.data;b=p.texCoord0?p.texCoord0.data:null;v=this.totalObjectScale(a.model,f);c&&(b=null);f={uv:b,append:[]};b||(f=this.boxUnwrap(g,l),b=f.uv);l=f.append;for(t in p)if("position"!==t&&p.hasOwnProperty(t)){var A=
p[t].data,B=p[t].components;for(g=0;g<l.length;g++)for(f=0;f<B;f++)A.push(A[l[g]*B+f])}if(x[k])for(w in b)x[k][w]=b[w];else x[k]=b;q[k]=v}for(d=0;d<a.model.vertices.length;d++){p=a.model.vertices[d];l=p.position.data;b=x[d];v=q[d];u[d]=l.length/3;for(f=0;f<l.length/3;f++)m.push(l[3*f]*v[0]),m.push(l[3*f+1]*v[1]),m.push(l[3*f+2]*v[2]);for(f=0;f<b.length;f++)h.push(b[f]);n[d]=r;r+=l.length/3}for(d=0;d<a.model.meshInstances.length;d++)for(b=a.model.meshInstances[d].mesh,k=a.model.meshes[b].vertices,
g=a.model.meshes[b].indices,f=0;f<g.length;f++)e.push(g[f]+n[k]);w=this.findCharts(e);c=this.calculateChartArea(e,w,m,h);m=this.normalizeCharts(e,w,c,h);r=1;if(!this.cancel){t=this.packCharts(e,w,c.aabbs,c,h,m,r);for(this.progress&&this.progress(30);!t;){if(this.cancel)return;r/=1+c.notFitted;console.log("divide "+r);t=this.packCharts(e,w,c.aabbs,c,h,m,r)}for(this.progress&&this.progress(50);;){if(this.cancel)return;console.log("Used area: "+c.usedArea);d=(1-c.usedArea)/5;t=r;r+=d;if(r===t)break;
console.log("grow "+r);t=this.packCharts(e,w,c.aabbs,c,h,m,r);if(!t)break}this.progress&&this.progress(90);r-=d;t=this.packCharts(e,w,c.aabbs,c,h,m,r);d=t.scaleOffset;this.finalTransformUv(e,w,h,m,r,d);for(d=0;d<a.model.vertices.length;d++){b=[];for(f=0;f<2*u[d];f++)b.push(h[2*n[d]+f]);p=a.model.vertices[d];p.texCoord1={data:b,components:2,type:"float32"}}this.progress&&this.progress(100);return{packedAabbs:t.packedAabbs,totalArea:c.totalArea}}},calculateAreaOfJsonModel:function(a){var c,e,h,d,f,
g,l,b,m,n,u,r,v,k,p=0;for(c=0;c<a.model.meshInstances.length;c++){d=a.model.meshInstances[c].mesh;f=a.model.meshInstances[c].node;h=a.model.meshes[d].vertices;d=a.model.meshes[d].indices;h=a.model.vertices[h];h=h.position.data;g=this.totalObjectScale(a.model,f);f=new Float32Array(h.length);l=h.length/3;for(e=0;e<l;e++)f[3*e]=h[3*e]*g[0],f[3*e+1]=h[3*e+1]*g[1],f[3*e+2]=h[3*e+2]*g[2];e=d.length/3;for(h=0;h<e;h++)b=d[3*h],m=d[3*h+1],n=d[3*h+2],g=f[3*b],l=f[3*b+1],b=f[3*b+2],u=f[3*m],r=f[3*m+1],m=f[3*
m+2],v=f[3*n],k=f[3*n+1],n=f[3*n+2],p+=this.triangleArea(g,l,b,u,r,m,v,k,n)}return p}};
