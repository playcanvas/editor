onmessage = function(evt) {
    if (! evt.data.name)
        return;

    switch(evt.data.name) {
        case 'start':
            start(evt.data.id, evt.data.filename, evt.data.padding);
            break;
        case 'area':
            area(evt.data.id, evt.data.filename);
            break;
    };
};

var loadFile = function(id, filename, fn) {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function() {
        try {
            var data = JSON.parse(this.responseText);
            fn(null, data);
        } catch(e) {
            fn(e);
        }
    });
    xhr.addEventListener('error', function() {
        fn(e);
    });

    xhr.open('GET', '/api/files/assets/' + id + '/1/' + filename, true);
    xhr.send(null);
};

var start = function(id, filename, padding) {
    loadFile(id, filename, function(err, data) {
        if (err) {
            postMessage({
                name: 'error',
                id: id,
                err: err.message,
                stack: err.stack.split('\n')
            });
            close();
        } else {
            var unwrap = new Unwrap();
            unwrap.progress = function(p) {
                postMessage({
                    name: 'progress',
                    id: id,
                    progress: p
                });
            };
            unwrap.unwrapJsonModel(data, true, padding, true);
            var area = unwrap.calculateAreaOfJsonModel(data);

            postMessage({
                name: 'finish',
                id: id,
                data: data,
                area: area
            });
            close();
        }
    });
};

var area = function(id, filename) {
    loadFile(id, filename, function(err, data) {
        if (err) {
            postMessage({
                name: 'error',
                id: id,
                err: err.message,
                stack: err.stack.split('\n')
            });
            close();
        } else {
            var unwrap = new Unwrap();
            var area = unwrap.calculateAreaOfJsonModel(data);

            postMessage({
                name: 'finish',
                id: id,
                area: area
            });
            close();
        }
    });
};

var Unwrap=function(){};
Unwrap.prototype={now:performance.now&&performance.timing?function(){return performance.now()}:Date.now,swap:function(a,b,c){var f=a[b];a[b]=a[c];a[c]=f},crossNormalize:function(a,b){var c=a.y*b.z-a.z*b.y,f=a.z*b.x-a.x*b.z,d=a.x*b.y-a.y*b.x,e=Math.sqrt(c*c+f*f+d*d);return{x:c/e,y:f/e,z:d/e}},triNormal:function(a,b,c,f,d,e,g,k,h){a-=f;b-=d;c-=e;f-=g;d-=k;h=e-h;e=b*h-c*d;h=c*f-a*h;a=a*d-b*f;b=Math.sqrt(e*e+h*h+a*a);return{x:e/b,y:h/b,z:a/b}},cubeFaceFromNormal:function(a){var b=Math.abs(a.x),c=Math.abs(a.y),
f=Math.abs(a.z);return b>=c&&b>=f?0>a.x?0:1:c>=b&&c>=f?0>a.y?2:3:0>a.z?4:5},boxUnwrap:function(a,b){this.now();var c=b.length/3,f,d,e,g,k,h,l,r,v,n=0,m;f=0;var q=[];for(m=0;6>m;m++)q[m]=[];for(m=0;m<a.length;m+=3)f=b[3*a[m]],d=b[3*a[m]+1],e=b[3*a[m]+2],g=b[3*a[m+1]],k=b[3*a[m+1]+1],h=b[3*a[m+1]+2],l=b[3*a[m+2]],r=b[3*a[m+2]+1],v=b[3*a[m+2]+2],f=this.triNormal(f,d,e,g,k,h,l,r,v),f=this.cubeFaceFromNormal(f),q[f].push(a[m]),q[f].push(a[m+1]),q[f].push(a[m+2]);for(m=1;6>m;m++);d=[];k=[];for(g=0;6>g;g++)for(f=
g+1;6>f;f++)for(m=0;m<q[g].length;m++){d=[];for(j=0;j<q[f].length;j++)q[g][m]===q[f][j]&&d.push(j);if(0<d.length){for(j=0;j<d.length;j++)q[f][d[j]]=c;k.push(q[g][m]);c++;n++}}for(m=0;m<n;m++)b.push(b[3*k[m]]),b.push(b[3*k[m]+1]),b.push(b[3*k[m]+2]);c=[];n=[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];for(g=offset=0;6>g;g++)for(m=n[g],h=this.crossNormalize(m,.5<Math.abs(m.y)?{x:1,y:0,z:0}:{x:0,y:1,z:0}),l=this.crossNormalize(m,h),h=this.crossNormalize(m,l),
m=0;m<q[g].length;m++)a[offset]=q[g][m],f=b[3*a[offset]],d=b[3*a[offset]+1],e=b[3*a[offset]+2],c[2*a[offset]]=h.x*f+h.y*d+h.z*e,c[2*a[offset]+1]=l.x*f+l.y*d+l.z*e,offset++;return{append:k,uv:c}},findCharts:function(a){this.now();var b,c,f,d=[],e=0,g;for(b=0;b<a.length;b++){f=3*Math.floor(b/3);e=Math.max(f,e);0===b%3&&(g=3);for(c=e;c<a.length;c++)a[b]===a[c]&&(c=3*Math.floor(c/3),this.swap(a,e,c),this.swap(a,e+1,c+1),this.swap(a,e+2,c+2),c+=2,e+=3,g--);2===b%3&&3>g&&(0<d.length&&d[d.length-1]>f?d[d.length-
1]=e:d.push(e))}for(b=a=0;b<d.length;b++)d[b]=(d[b]-3*a)/3,a+=d[b];return d},triangleArea:function(a,b,c,f,d,e,g,k,h){f-=a;d-=b;e-=c;g-=a;k-=b;h-=c;a=d*h-e*k;e=e*g-f*h;f=f*k-d*g;return.5*Math.sqrt(a*a+e*e+f*f)},calculateChartArea:function(a,b,c,f){var d,e,g,k,h,l,r,v,n,m,q,t,p,x,w,u=0,A,B,E=[],F=[],H=0,I=0,y,z,C,D,G=[];for(d=0;d<b.length;d++){g=b[d];B=A=0;y=z=99999;C=D=-99999;for(e=0;e<g;e++)k=u+e,h=a[3*k],l=a[3*k+1],k=a[3*k+2],r=c[3*h],v=c[3*h+1],n=c[3*h+2],m=c[3*l],q=c[3*l+1],t=c[3*l+2],p=c[3*k],
x=c[3*k+1],w=c[3*k+2],A+=this.triangleArea(r,v,n,m,q,t,p,x,w),r=f[2*h],h=f[2*h+1],v=f[2*l],l=f[2*l+1],n=f[2*k],k=f[2*k+1],B+=this.triangleArea(r,h,0,v,l,0,n,k,0),y=Math.min(y,r),y=Math.min(y,v),y=Math.min(y,n),z=Math.min(z,h),z=Math.min(z,l),z=Math.min(z,k),C=Math.max(C,r),C=Math.max(C,v),C=Math.max(C,n),D=Math.max(D,h),D=Math.max(D,l),D=Math.max(D,k);0===A&&(B=A=.01,C=y+.01,D=z+.01);isNaN(A)&&(B=A=.01,C=y+.01,D=z+.01);0===B&&(B=.01,C=y+.01,D=z+.01);H+=A;E.push(A);u+=g;G[d]={x:0,y:0,z:0,w:0};G[d].x=
y;G[d].y=z;G[d].z=C-G[d].x;G[d].w=D-G[d].y;I+=B;F.push(B)}return{areas:E,areasT:F,totalArea:H,totalAreaT:I,aabbs:G}},normalizeCharts:function(a,b,c,f,d,e){a=c.areas;f=c.areasT;e=c.totalArea;var g=[];for(c=0;c<b.length;c++)d=.8*Math.sqrt(1/f[c]*(a[c]/e)),g.push(d);return g},fits:function(a,b){return a.z<=b.z&&a.w<=b.w},fitsExactly:function(a,b){return a.z===b.z&&a.w===b.w},findHoles:function(a,b,c,f,d,e,g,k){var h;c=Math.floor((a.aabb.z*this.resolution-2*this.padding)/4);var l=Math.floor((a.aabb.w*
this.resolution-2*this.padding)/4);if(0>=c||0>=l||1E3<c||1E3<l)return[];var r=new Uint8Array(c*l),v=0;for(h=0;h<d.length&&h!==b;h++)v+=d[h];var n=d[b],m=g[b].x*k,q=g[b].y*k,t=g[b].z*k,p=g[b].w*k,x,w,u;for(h=0;h<n;h++){d=e[3*(v+h)];g=e[3*(v+h)+1];b=e[3*(v+h)+2];x=f[2*d]*k;w=f[2*d+1]*k;var A=f[2*g]*k,B=f[2*g+1]*k,E=f[2*b]*k,F=f[2*b+1]*k;x=(x-m)/t;A=(A-m)/t;E=(E-m)/t;w=(w-q)/p;B=(B-q)/p;F=(F-q)/p;g=b=99999;u=d=-99999;b=Math.min(b,x);b=Math.min(b,A);b=Math.min(b,E);g=Math.min(g,w);g=Math.min(g,B);g=Math.min(g,
F);d=Math.max(d,x);d=Math.max(d,A);d=Math.max(d,E);u=Math.max(u,w);u=Math.max(u,B);u=Math.max(u,F);b*=c;d*=c;g*=l;u*=l;b=Math.floor(b)-this.padding;g=Math.floor(g)-this.padding;d=Math.floor(d)+this.padding;u=Math.floor(u)+this.padding;0>b&&(b=0);b>=c&&(b=c-1);0>g&&(g=0);g>=l&&(g=l-1);0>d&&(d=0);d>=c&&(d=c-1);0>u&&(u=0);u>=l&&(u=l-1);for(w=g;w<=u;w++)for(x=b;x<=d;x++)r[w*c+x]=255}b=Math.max(c,l);f=[r];h=c;d=l;e=[h];k=[d];for(g=0;8<b;){n=Math.floor(h/2);m=Math.floor(d/2);v=new Uint8Array(n*m);for(w=
0;w<m;w++)for(x=0;x<n;x++){for(p=b=0;2>p;p++)for(t=0;2>t;t++)b=Math.max(b,f[g][(2*w+p)*h+(2*x+t)]);v[w*n+x]=b}b=Math.max(n,m);h=n;d=m;g++;f[g]=v;e[g]=n;k[g]=m}q=[];for(h=f.length-1;0<=h;h--)for(n=e[h],m=k[h],v=f[h],A=c/n,B=l/m,w=0;w<m;w++)for(x=0;x<n;x++)if(0===v[w*n+x]){g=Math.floor(x*A);u=Math.floor(w*B);d=b=g;g=u;for(var E=b,F=g,H=d,I=u,y=!0,z=0,C=!0;y;){if(0>b||0>g||d>c-1||u>l-1)y=!1;else for(p=g;p<=u;p++){for(t=b;t<=d;t++)if(0<r[p*c+t]){y=!1;break}if(!y)break}if(y)for(t=0;t<q.length;t++)if(!(q[t].maxx<
b||q[t].minx>d||q[t].maxy<g||q[t].miny>u)){y=!1;break}if(!y){if(C)break;b=E;g=F;d=H;u=I;z++;if(6>z)y=!0;else break}C=!1;E=b;F=g;H=d;I=u;0===z?(g--,b--):1===z?(u++,d++):2===z?b--:3===z?g--:4===z?d++:5===z&&u++}C||q.push({minx:b,miny:g,maxx:d,maxy:u})}for(h=0;h<q.length;h++)r={x:0,y:0,z:0,w:0},r.x=q[h].minx/c*a.aabb.z+a.aabb.x,r.y=q[h].miny/l*a.aabb.w+a.aabb.y,r.z=(q[h].maxx-q[h].minx)/c*a.aabb.z,r.w=(q[h].maxy-q[h].miny)/l*a.aabb.w,q[h]={aabb:r,id:-1,child:[],leaf:!0,insideHole:!0};return q},insertToAtlas:function(a,
b,c,f,d,e,g,k){if(a.leaf){if(0<=a.id||!this.fits(c,a.aabb))return null;if(this.fitsExactly(c,a.aabb))return a.id=b,this.fillHoles&&(b=this.findHoles(a,b,c,f,d,e,g,k),0<b.length&&(a.leaf=!1,a.child=b)),a;var h={x:0,y:0,z:0,w:0},l={x:0,y:0,z:0,w:0};a.aabb.z-c.z>a.aabb.w-c.w?(h.x=a.aabb.x,h.y=a.aabb.y,h.z=c.z,h.w=a.aabb.w,l.x=a.aabb.x+c.z,l.y=a.aabb.y,l.z=a.aabb.z-c.z,l.w=a.aabb.w):(h.x=a.aabb.x,h.y=a.aabb.y,h.z=a.aabb.z,h.w=c.w,l.x=a.aabb.x,l.y=a.aabb.y+c.w,l.z=a.aabb.z,l.w=a.aabb.w-c.w);a.leaf=!1;
a.child=[];a.child[0]={aabb:h,id:-1,child:[],leaf:!0,test:!1};a.child[1]={aabb:l,id:-1,child:[],leaf:!0,test:!1};return this.insertToAtlas(a.child[0],b,c,f,d,e,g,k)}for(h=0;h<a.child.length;h++)if(l=this.insertToAtlas(a.child[h],b,c,f,d,e,g,k))return l;return null},transformUv:function(a,b){a.x=a.x*b.x+b.z;a.y=a.y*b.y+b.w},packCharts:function(a,b,c,f,d,e,g){this.now();var k,h={aabb:{x:0,y:0,z:1,w:1},id:-1,child:[],leaf:!0,test:!1},l=[],r=[];for(k=0;k<b.length;k++)r[k]=k;r.sort(function(a,b){return Math.max(c[b].z*
e[b],c[b].w*e[b])-Math.max(c[a].z*e[a],c[a].w*e[a])});for(var v=0,n=0,m=0,q=0,t=99999,p,x=0;x<c.length;x++){k=r[x];p={x:c[k].x,y:c[k].y,z:c[k].z,w:c[k].w};p.x=p.x*e[k]*g;p.y=p.y*e[k]*g;p.z=p.z*e[k]*g;p.w=p.w*e[k]*g;p.z+=2*this.paddingUv;p.w+=2*this.paddingUv;var w=this.insertToAtlas(h,k,p,d,b,a,c,e[k]*g);w?(l[k]=w.aabb,w.insideHole||(n+=l[k].z*l[k].w)):v+=p.z*p.w;m=Math.max(m,p.z);q=Math.max(q,p.w);t=Math.min(t,p.z)}f.usedArea=n;f.maxWidth=m;f.maxHeight=q;f.minWidth=t;if(0<v)return f.notFitted=v,
!1;for(k=0;k<l.length;k++)l[k].z>2*this.paddingUv&&l[k].w>2*this.paddingUv&&(l[k].x+=this.paddingUv,l[k].y+=this.paddingUv,l[k].z-=2*this.paddingUv,l[k].w-=2*this.paddingUv);a=[];for(k=0;k<c.length;k++)p={x:c[k].x,y:c[k].y,z:c[k].z,w:c[k].w},p.x=p.x*e[k]*g,p.y=p.y*e[k]*g,p.z=p.z*e[k]*g,p.w=p.w*e[k]*g,b=l[k].z/p.z,f=l[k].w/p.w,a.push({x:b,y:f,z:l[k].x-p.x*b,w:l[k].y-p.y*f});return{scaleOffset:a,packedAabbs:l}},transformUv2:function(a,b,c,f){a.x=a.x*b*c;a.y=a.y*b*c;return this.transformUv(a,f)},finalTransformUv:function(a,
b,c,f,d,e){var g,k,h,l,r,v={x:0,y:0},n={x:0,y:0},m={x:0,y:0},q=0,t=[];for(g=0;g<b.length;g++){chartTris=b[g];for(k=0;k<chartTris;k++)h=q+k,l=a[3*h],r=a[3*h+1],h=a[3*h+2],v.x=c[2*l],v.y=c[2*l+1],n.x=c[2*r],n.y=c[2*r+1],m.x=c[2*h],m.y=c[2*h+1],t[l]||this.transformUv2(v,f[g],d,e[g]),t[r]||this.transformUv2(n,f[g],d,e[g]),t[h]||this.transformUv2(m,f[g],d,e[g]),c[2*l]=v.x,c[2*l+1]=v.y,c[2*r]=n.x,c[2*r+1]=n.y,c[2*h]=m.x,c[2*h+1]=m.y,t[l]=!0,t[r]=!0,t[h]=!0;q+=chartTris}},totalObjectScale:function(a,b){for(var c=
a.nodes[b].scale,f=c[0],d=c[1],c=c[2],e=a.parents[b],g;0<=e;)g=a.nodes[e].scale,f*=g[0],d*=g[1],c*=g[2],e=a.parents[e];return[f,d,c]},unwrapJsonModel:function(a,b,c,f){this.resolution=1024;this.padding=c;this.paddingUv=this.padding/this.resolution;this.fillHoles=f;var d,e,g,k,h;c=[];var l=[];f=[];var r=[],v=[],n=0,m,q,t,p=[],x=[],w,u;d=.025;h=[];for(d=0;d<a.model.meshInstances.length;d++)if(void 0===h[d])for(h[d]=-1,e=d+1;e<a.model.meshInstances.length;e++)a.model.meshInstances[d].mesh===a.model.meshInstances[e].mesh&&
(h[d]=0,h[e]=1);for(d=0;d<a.model.meshInstances.length;d++){this.progress&&this.progress(d/a.model.meshInstances.length*30);if(this.cancel)return;h=a.model.meshInstances[d].mesh;e=a.model.meshInstances[d].node;q=a.model.meshes[h].vertices;g=a.model.meshes[h].indices;t=a.model.vertices[q];k=t.position.data;h=t.texCoord0?t.texCoord0.data:null;m=this.totalObjectScale(a.model,e);b&&(h=null);e={uv:h,append:[]};h||(e=this.boxUnwrap(g,k),h=e.uv);k=e.append;for(u in t)if("position"!==u&&t.hasOwnProperty(u)){var A=
t[u].data,B=t[u].components;for(g=0;g<k.length;g++)for(e=0;e<B;e++)A.push(A[k[g]*B+e])}if(p[q])for(w in h)p[q][w]=h[w];else p[q]=h;x[q]=m}for(d=0;d<a.model.vertices.length;d++){t=a.model.vertices[d];k=t.position.data;h=p[d];m=x[d];v[d]=k.length/3;for(e=0;e<k.length/3;e++)l.push(k[3*e]*m[0]),l.push(k[3*e+1]*m[1]),l.push(k[3*e+2]*m[2]);for(e=0;e<h.length;e++)f.push(h[e]);r[d]=n;n+=k.length/3}for(d=0;d<a.model.meshInstances.length;d++)for(h=a.model.meshInstances[d].mesh,q=a.model.meshes[h].vertices,
g=a.model.meshes[h].indices,e=0;e<g.length;e++)c.push(g[e]+r[q]);w=this.findCharts(c);b=this.calculateChartArea(c,w,l,f);l=this.normalizeCharts(c,w,b,f);n=1;if(!this.cancel){u=this.packCharts(c,w,b.aabbs,b,f,l,n);for(this.progress&&this.progress(30);!u;){if(this.cancel)return;n/=1+b.notFitted;u=this.packCharts(c,w,b.aabbs,b,f,l,n)}for(this.progress&&this.progress(50);;){if(this.cancel)return;d=(1-b.usedArea)/5;u=n;n+=d;if(n===u)break;u=this.packCharts(c,w,b.aabbs,b,f,l,n);if(!u)break}this.progress&&
this.progress(90);n-=d;u=this.packCharts(c,w,b.aabbs,b,f,l,n);d=u.scaleOffset;this.finalTransformUv(c,w,f,l,n,d);for(d=0;d<a.model.vertices.length;d++){h=[];for(e=0;e<2*v[d];e++)h.push(f[2*r[d]+e]);t=a.model.vertices[d];t.texCoord1={data:h,components:2,type:"float32"}}this.progress&&this.progress(100);return{packedAabbs:u.packedAabbs,totalArea:b.totalArea}}},calculateAreaOfJsonModel:function(a){var b,c,f,d,e,g,k,h,l,r,v,n,m,q,t=0;for(b=0;b<a.model.meshInstances.length;b++){d=a.model.meshInstances[b].mesh;
e=a.model.meshInstances[b].node;f=a.model.meshes[d].vertices;d=a.model.meshes[d].indices;f=a.model.vertices[f];f=f.position.data;g=this.totalObjectScale(a.model,e);e=new Float32Array(f.length);k=f.length/3;for(c=0;c<k;c++)e[3*c]=f[3*c]*g[0],e[3*c+1]=f[3*c+1]*g[1],e[3*c+2]=f[3*c+2]*g[2];c=d.length/3;for(f=0;f<c;f++)h=d[3*f],l=d[3*f+1],r=d[3*f+2],g=e[3*h],k=e[3*h+1],h=e[3*h+2],v=e[3*l],n=e[3*l+1],l=e[3*l+2],m=e[3*r],q=e[3*r+1],r=e[3*r+2],t+=this.triangleArea(g,k,h,v,n,l,m,q,r)}return t},calculateUv1AreaOfJsonModel:function(a){var b,
c,f,d,e,g,k,h,l,r,v,n=0;for(b=0;b<a.model.meshInstances.length;b++)for(f=a.model.meshInstances[b].mesh,c=a.model.meshes[f].vertices,f=a.model.meshes[f].indices,c=a.model.vertices[c],d=c.texCoord1.data,e=f.length/3,c=0;c<e;c++)g=f[3*c],k=f[3*c+1],h=f[3*c+2],l=d[2*g],g=d[2*g+1],r=d[2*k],k=d[2*k+1],v=d[2*h],h=d[2*h+1],n+=this.triangleArea(l,g,0,r,k,0,v,h,0);return n},calculateMultiAreaOfJsonModel:function(a){var b,c,f,d,e,g,k,h,l,r,v,n,m,q,t,p={x:0,y:0,z:0};for(b=0;b<a.model.meshInstances.length;b++){d=
a.model.meshInstances[b].mesh;e=a.model.meshInstances[b].node;f=a.model.meshes[d].vertices;d=a.model.meshes[d].indices;f=a.model.vertices[f];f=f.position.data;g=this.totalObjectScale(a.model,e);e=new Float32Array(f.length);k=f.length/3;for(c=0;c<k;c++)e[3*c]=f[3*c]*g[0],e[3*c+1]=f[3*c+1]*g[1],e[3*c+2]=f[3*c+2]*g[2];c=d.length/3;for(f=0;f<c;f++)h=d[3*f],l=d[3*f+1],r=d[3*f+2],g=e[3*h],k=e[3*h+1],h=e[3*h+2],v=e[3*l],n=e[3*l+1],l=e[3*l+2],m=e[3*r],q=e[3*r+1],t=e[3*r+2],r=this.triNormal(g,k,h,v,n,l,m,
q,t),g=this.triangleArea(g,k,h,v,n,l,m,q,t),0<g&&(p.x+=g*Math.abs(r.x),p.y+=g*Math.abs(r.y),p.z+=g*Math.abs(r.z))}return p}};
