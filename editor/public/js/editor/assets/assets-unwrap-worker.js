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
            var area = unwrap.calculateMultiAreaOfJsonModel(data);

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
            var area = unwrap.calculateMultiAreaOfJsonModel(data);

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
Unwrap.prototype={now:performance.now&&performance.timing?function(){return performance.now()}:Date.now,swap:function(a,b,c){var h=a[b];a[b]=a[c];a[c]=h},crossNormalize:function(a,b){var c=a.y*b.z-a.z*b.y,h=a.z*b.x-a.x*b.z,d=a.x*b.y-a.y*b.x,e=Math.sqrt(c*c+h*h+d*d);return{x:c/e,y:h/e,z:d/e}},triNormal:function(a,b,c,h,d,e,f,k,g){a-=h;b-=d;c-=e;h-=f;d-=k;g=e-g;e=b*g-c*d;g=c*h-a*g;a=a*d-b*h;b=Math.sqrt(e*e+g*g+a*a);return{x:e/b,y:g/b,z:a/b}},cubeFaceFromNormal:function(a){var b=Math.abs(a.x),c=Math.abs(a.y),
h=Math.abs(a.z);return b>=c&&b>=h?0>a.x?0:1:c>=b&&c>=h?0>a.y?2:3:0>a.z?4:5},boxUnwrap:function(a,b){this.now();var c=b.length/3,h,d,e,f,k,g,l,t,v,p=0,m;h=0;var q=[];for(m=0;6>m;m++)q[m]=[];for(m=0;m<a.length;m+=3)h=b[3*a[m]],d=b[3*a[m]+1],e=b[3*a[m]+2],f=b[3*a[m+1]],k=b[3*a[m+1]+1],g=b[3*a[m+1]+2],l=b[3*a[m+2]],t=b[3*a[m+2]+1],v=b[3*a[m+2]+2],h=this.triNormal(h,d,e,f,k,g,l,t,v),h=this.cubeFaceFromNormal(h),q[h].push(a[m]),q[h].push(a[m+1]),q[h].push(a[m+2]);for(m=1;6>m;m++);d=[];k=[];for(f=0;6>f;f++)for(h=
f+1;6>h;h++)for(m=0;m<q[f].length;m++){d=[];for(j=0;j<q[h].length;j++)q[f][m]===q[h][j]&&d.push(j);if(0<d.length){for(j=0;j<d.length;j++)q[h][d[j]]=c;k.push(q[f][m]);c++;p++}}for(m=0;m<p;m++)b.push(b[3*k[m]]),b.push(b[3*k[m]+1]),b.push(b[3*k[m]+2]);c=[];p=[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];for(f=offset=0;6>f;f++)for(m=p[f],g=this.crossNormalize(m,.5<Math.abs(m.y)?{x:1,y:0,z:0}:{x:0,y:1,z:0}),l=this.crossNormalize(m,g),g=this.crossNormalize(m,l),
m=0;m<q[f].length;m++)a[offset]=q[f][m],h=b[3*a[offset]],d=b[3*a[offset]+1],e=b[3*a[offset]+2],c[2*a[offset]]=g.x*h+g.y*d+g.z*e,c[2*a[offset]+1]=l.x*h+l.y*d+l.z*e,offset++;return{append:k,uv:c}},findCharts:function(a){this.now();var b,c,h,d=[],e=0,f;for(b=0;b<a.length;b++){h=3*Math.floor(b/3);e=Math.max(h,e);0===b%3&&(f=3);for(c=e;c<a.length;c++)a[b]===a[c]&&(c=3*Math.floor(c/3),this.swap(a,e,c),this.swap(a,e+1,c+1),this.swap(a,e+2,c+2),c+=2,e+=3,f--);2===b%3&&3>f&&(0<d.length&&d[d.length-1]>h?d[d.length-
1]=e:d.push(e))}for(b=a=0;b<d.length;b++)d[b]=(d[b]-3*a)/3,a+=d[b];return d},triangleArea:function(a,b,c,h,d,e,f,k,g){h-=a;d-=b;e-=c;f-=a;k-=b;g-=c;a=d*g-e*k;e=e*f-h*g;h=h*k-d*f;return.5*Math.sqrt(a*a+e*e+h*h)},calculateChartArea:function(a,b,c,h){var d,e,f,k,g,l,t,v,p,m,q,r,n,x,w,u=0,A,B,E=[],F=[],H=0,I=0,y,z,C,D,G=[];for(d=0;d<b.length;d++){f=b[d];B=A=0;y=z=99999;C=D=-99999;for(e=0;e<f;e++)k=u+e,g=a[3*k],l=a[3*k+1],k=a[3*k+2],t=c[3*g],v=c[3*g+1],p=c[3*g+2],m=c[3*l],q=c[3*l+1],r=c[3*l+2],n=c[3*k],
x=c[3*k+1],w=c[3*k+2],A+=this.triangleArea(t,v,p,m,q,r,n,x,w),t=h[2*g],g=h[2*g+1],v=h[2*l],l=h[2*l+1],p=h[2*k],k=h[2*k+1],B+=this.triangleArea(t,g,0,v,l,0,p,k,0),y=Math.min(y,t),y=Math.min(y,v),y=Math.min(y,p),z=Math.min(z,g),z=Math.min(z,l),z=Math.min(z,k),C=Math.max(C,t),C=Math.max(C,v),C=Math.max(C,p),D=Math.max(D,g),D=Math.max(D,l),D=Math.max(D,k);0===A&&(B=A=.01,C=y+.01,D=z+.01);isNaN(A)&&(B=A=.01,C=y+.01,D=z+.01);0===B&&(B=.01,C=y+.01,D=z+.01);H+=A;E.push(A);u+=f;G[d]={x:0,y:0,z:0,w:0};G[d].x=
y;G[d].y=z;G[d].z=C-G[d].x;G[d].w=D-G[d].y;I+=B;F.push(B)}return{areas:E,areasT:F,totalArea:H,totalAreaT:I,aabbs:G}},normalizeCharts:function(a,b,c,h,d,e){var f;a=c.areas;h=c.areasT;e=c.totalArea;var k=[];d=c.aabbs;for(c=0;c<b.length;c++){var g=a[c]/e;f=.8*Math.sqrt(1/h[c]*g);f=Math.min(f,.8*Math.sqrt(1/(d[c].z*d[c].w)*g));1E5<f&&(f=.1);k.push(f)}return k},fits:function(a,b){return a.z<=b.z&&a.w<=b.w},fitsExactly:function(a,b){return a.z===b.z&&a.w===b.w},findHoles:function(a,b,c,h,d,e,f,k){var g;
c=Math.floor((a.aabb.z*this.resolution-2*this.padding)/4);var l=Math.floor((a.aabb.w*this.resolution-2*this.padding)/4);if(0>=c||0>=l||1E3<c||1E3<l)return[];var t=new Uint8Array(c*l),v=0;for(g=0;g<d.length&&g!==b;g++)v+=d[g];var p=d[b],m=f[b].x*k,q=f[b].y*k,r=f[b].z*k,n=f[b].w*k,x,w,u;for(g=0;g<p;g++){d=e[3*(v+g)];f=e[3*(v+g)+1];b=e[3*(v+g)+2];x=h[2*d]*k;w=h[2*d+1]*k;var A=h[2*f]*k,B=h[2*f+1]*k,E=h[2*b]*k,F=h[2*b+1]*k;x=(x-m)/r;A=(A-m)/r;E=(E-m)/r;w=(w-q)/n;B=(B-q)/n;F=(F-q)/n;f=b=99999;u=d=-99999;
b=Math.min(b,x);b=Math.min(b,A);b=Math.min(b,E);f=Math.min(f,w);f=Math.min(f,B);f=Math.min(f,F);d=Math.max(d,x);d=Math.max(d,A);d=Math.max(d,E);u=Math.max(u,w);u=Math.max(u,B);u=Math.max(u,F);b*=c;d*=c;f*=l;u*=l;b=Math.floor(b)-this.padding;f=Math.floor(f)-this.padding;d=Math.floor(d)+this.padding;u=Math.floor(u)+this.padding;0>b&&(b=0);b>=c&&(b=c-1);0>f&&(f=0);f>=l&&(f=l-1);0>d&&(d=0);d>=c&&(d=c-1);0>u&&(u=0);u>=l&&(u=l-1);for(w=f;w<=u;w++)for(x=b;x<=d;x++)t[w*c+x]=255}b=Math.max(c,l);h=[t];g=c;
d=l;e=[g];k=[d];for(f=0;8<b;){p=Math.floor(g/2);m=Math.floor(d/2);v=new Uint8Array(p*m);for(w=0;w<m;w++)for(x=0;x<p;x++){for(n=b=0;2>n;n++)for(r=0;2>r;r++)b=Math.max(b,h[f][(2*w+n)*g+(2*x+r)]);v[w*p+x]=b}b=Math.max(p,m);g=p;d=m;f++;h[f]=v;e[f]=p;k[f]=m}q=[];for(g=h.length-1;0<=g;g--)for(p=e[g],m=k[g],v=h[g],A=c/p,B=l/m,w=0;w<m;w++)for(x=0;x<p;x++)if(0===v[w*p+x]){f=Math.floor(x*A);u=Math.floor(w*B);d=b=f;f=u;for(var E=b,F=f,H=d,I=u,y=!0,z=0,C=!0;y;){if(0>b||0>f||d>c-1||u>l-1)y=!1;else for(n=f;n<=
u;n++){for(r=b;r<=d;r++)if(0<t[n*c+r]){y=!1;break}if(!y)break}if(y)for(r=0;r<q.length;r++)if(!(q[r].maxx<b||q[r].minx>d||q[r].maxy<f||q[r].miny>u)){y=!1;break}if(!y){if(C)break;b=E;f=F;d=H;u=I;z++;if(6>z)y=!0;else break}C=!1;E=b;F=f;H=d;I=u;0===z?(f--,b--):1===z?(u++,d++):2===z?b--:3===z?f--:4===z?d++:5===z&&u++}C||q.push({minx:b,miny:f,maxx:d,maxy:u})}for(g=0;g<q.length;g++)t={x:0,y:0,z:0,w:0},t.x=q[g].minx/c*a.aabb.z+a.aabb.x,t.y=q[g].miny/l*a.aabb.w+a.aabb.y,t.z=(q[g].maxx-q[g].minx)/c*a.aabb.z,
t.w=(q[g].maxy-q[g].miny)/l*a.aabb.w,q[g]={aabb:t,id:-1,child:[],leaf:!0,insideHole:!0};return q},insertToAtlas:function(a,b,c,h,d,e,f,k){if(a.leaf){if(0<=a.id||!this.fits(c,a.aabb))return null;if(this.fitsExactly(c,a.aabb))return a.id=b,this.fillHoles&&(b=this.findHoles(a,b,c,h,d,e,f,k),0<b.length&&(a.leaf=!1,a.child=b)),a;var g={x:0,y:0,z:0,w:0},l={x:0,y:0,z:0,w:0};a.aabb.z-c.z>a.aabb.w-c.w?(g.x=a.aabb.x,g.y=a.aabb.y,g.z=c.z,g.w=a.aabb.w,l.x=a.aabb.x+c.z,l.y=a.aabb.y,l.z=a.aabb.z-c.z,l.w=a.aabb.w):
(g.x=a.aabb.x,g.y=a.aabb.y,g.z=a.aabb.z,g.w=c.w,l.x=a.aabb.x,l.y=a.aabb.y+c.w,l.z=a.aabb.z,l.w=a.aabb.w-c.w);a.leaf=!1;a.child=[];a.child[0]={aabb:g,id:-1,child:[],leaf:!0,test:!1};a.child[1]={aabb:l,id:-1,child:[],leaf:!0,test:!1};return this.insertToAtlas(a.child[0],b,c,h,d,e,f,k)}for(g=0;g<a.child.length;g++)if(l=this.insertToAtlas(a.child[g],b,c,h,d,e,f,k))return l;return null},transformUv:function(a,b){a.x=a.x*b.x+b.z;a.y=a.y*b.y+b.w},packCharts:function(a,b,c,h,d,e,f){this.now();var k,g={aabb:{x:0,
y:0,z:1,w:1},id:-1,child:[],leaf:!0,test:!1},l=[],t=[];for(k=0;k<b.length;k++)t[k]=k;t.sort(function(a,b){return Math.max(c[b].z*e[b],c[b].w*e[b])-Math.max(c[a].z*e[a],c[a].w*e[a])});for(var v=0,p=0,m=0,q=0,r=99999,n,x=0;x<c.length;x++){k=t[x];n={x:c[k].x,y:c[k].y,z:c[k].z,w:c[k].w};n.x=n.x*e[k]*f;n.y=n.y*e[k]*f;n.z=n.z*e[k]*f;n.w=n.w*e[k]*f;n.z+=2*this.paddingUv;n.w+=2*this.paddingUv;var w=this.insertToAtlas(g,k,n,d,b,a,c,e[k]*f);w?(l[k]=w.aabb,w.insideHole||(p+=l[k].z*l[k].w)):v+=n.z*n.w;m=Math.max(m,
n.z);q=Math.max(q,n.w);r=Math.min(r,n.z)}h.usedArea=p;h.maxWidth=m;h.maxHeight=q;h.minWidth=r;if(0<v)return h.notFitted=v,!1;for(k=0;k<l.length;k++)l[k].z>2*this.paddingUv&&l[k].w>2*this.paddingUv&&(l[k].x+=this.paddingUv,l[k].y+=this.paddingUv,l[k].z-=2*this.paddingUv,l[k].w-=2*this.paddingUv);a=[];for(k=0;k<c.length;k++)n={x:c[k].x,y:c[k].y,z:c[k].z,w:c[k].w},n.x=n.x*e[k]*f,n.y=n.y*e[k]*f,n.z=n.z*e[k]*f,n.w=n.w*e[k]*f,b=l[k].z/n.z,h=l[k].w/n.w,a.push({x:b,y:h,z:l[k].x-n.x*b,w:l[k].y-n.y*h});return{scaleOffset:a,
packedAabbs:l}},transformUv2:function(a,b,c,h){a.x=a.x*b*c;a.y=a.y*b*c;return this.transformUv(a,h)},finalTransformUv:function(a,b,c,h,d,e){var f,k,g,l,t,v={x:0,y:0},p={x:0,y:0},m={x:0,y:0},q=0,r=[];for(f=0;f<b.length;f++){chartTris=b[f];for(k=0;k<chartTris;k++)g=q+k,l=a[3*g],t=a[3*g+1],g=a[3*g+2],v.x=c[2*l],v.y=c[2*l+1],p.x=c[2*t],p.y=c[2*t+1],m.x=c[2*g],m.y=c[2*g+1],r[l]||this.transformUv2(v,h[f],d,e[f]),r[t]||this.transformUv2(p,h[f],d,e[f]),r[g]||this.transformUv2(m,h[f],d,e[f]),c[2*l]=v.x,c[2*
l+1]=v.y,c[2*t]=p.x,c[2*t+1]=p.y,c[2*g]=m.x,c[2*g+1]=m.y,r[l]=!0,r[t]=!0,r[g]=!0;q+=chartTris}},totalObjectScale:function(a,b){for(var c=a.nodes[b].scale,h=c[0],d=c[1],c=c[2],e=a.parents[b],f;0<=e;)f=a.nodes[e].scale,h*=f[0],d*=f[1],c*=f[2],e=a.parents[e];return[h,d,c]},unwrapJsonModel:function(a,b,c,h){this.resolution=1024;this.padding=c;this.paddingUv=this.padding/this.resolution;this.fillHoles=h;var d,e,f,k,g;c=[];var l=[];h=[];var t=[],v=[],p=0,m,q,r,n=[],x=[],w,u;d=.025;g=[];for(d=0;d<a.model.meshInstances.length;d++)if(void 0===
g[d])for(g[d]=-1,e=d+1;e<a.model.meshInstances.length;e++)a.model.meshInstances[d].mesh===a.model.meshInstances[e].mesh&&(g[d]=0,g[e]=1);for(d=0;d<a.model.meshInstances.length;d++){this.progress&&this.progress(d/a.model.meshInstances.length*30);if(this.cancel)return;g=a.model.meshInstances[d].mesh;e=a.model.meshInstances[d].node;q=a.model.meshes[g].vertices;f=a.model.meshes[g].indices;r=a.model.vertices[q];k=r.position.data;g=r.texCoord0?r.texCoord0.data:null;m=this.totalObjectScale(a.model,e);b&&
(g=null);e={uv:g,append:[]};g||(e=this.boxUnwrap(f,k),g=e.uv);k=e.append;for(u in r)if("position"!==u&&r.hasOwnProperty(u)){var A=r[u].data,B=r[u].components;for(f=0;f<k.length;f++)for(e=0;e<B;e++)A.push(A[k[f]*B+e])}if(n[q])for(w in g)n[q][w]=g[w];else n[q]=g;x[q]=m}for(d=0;d<a.model.vertices.length;d++){r=a.model.vertices[d];k=r.position.data;g=n[d];m=x[d];v[d]=k.length/3;for(e=0;e<k.length/3;e++)l.push(k[3*e]*m[0]),l.push(k[3*e+1]*m[1]),l.push(k[3*e+2]*m[2]);for(e=0;e<g.length;e++)h.push(g[e]);
t[d]=p;p+=k.length/3}for(d=0;d<a.model.meshInstances.length;d++)for(g=a.model.meshInstances[d].mesh,q=a.model.meshes[g].vertices,f=a.model.meshes[g].indices,e=0;e<f.length;e++)c.push(f[e]+t[q]);w=this.findCharts(c);b=this.calculateChartArea(c,w,l,h);l=this.normalizeCharts(c,w,b,h);p=1;if(!this.cancel){u=this.packCharts(c,w,b.aabbs,b,h,l,p);for(this.progress&&this.progress(30);!u;){if(this.cancel)return;p/=1+b.notFitted;u=this.packCharts(c,w,b.aabbs,b,h,l,p)}for(this.progress&&this.progress(50);;){if(this.cancel)return;
d=(1-b.usedArea)/5;u=p;p+=d;if(p===u)break;u=this.packCharts(c,w,b.aabbs,b,h,l,p);if(!u)break}this.progress&&this.progress(90);p-=d;u=this.packCharts(c,w,b.aabbs,b,h,l,p);d=u.scaleOffset;this.finalTransformUv(c,w,h,l,p,d);for(d=0;d<a.model.vertices.length;d++){g=[];for(e=0;e<2*v[d];e++)g.push(h[2*t[d]+e]);r=a.model.vertices[d];r.texCoord1={data:g,components:2,type:"float32"}}this.progress&&this.progress(100);return{packedAabbs:u.packedAabbs,totalArea:b.totalArea}}},calculateAreaOfJsonModel:function(a){var b,
c,h,d,e,f,k,g,l,t,v,p,m,q,r=0;for(b=0;b<a.model.meshInstances.length;b++){d=a.model.meshInstances[b].mesh;e=a.model.meshInstances[b].node;h=a.model.meshes[d].vertices;d=a.model.meshes[d].indices;h=a.model.vertices[h];h=h.position.data;f=this.totalObjectScale(a.model,e);e=new Float32Array(h.length);k=h.length/3;for(c=0;c<k;c++)e[3*c]=h[3*c]*f[0],e[3*c+1]=h[3*c+1]*f[1],e[3*c+2]=h[3*c+2]*f[2];c=d.length/3;for(h=0;h<c;h++)g=d[3*h],l=d[3*h+1],t=d[3*h+2],f=e[3*g],k=e[3*g+1],g=e[3*g+2],v=e[3*l],p=e[3*l+
1],l=e[3*l+2],m=e[3*t],q=e[3*t+1],t=e[3*t+2],r+=this.triangleArea(f,k,g,v,p,l,m,q,t)}return r},calculateMultiAreaOfJsonModel:function(a){var b,c,h,d,e,f,k,g,l,t,v,p,m,q,r,n={x:0,y:0,z:0};for(b=0;b<a.model.meshInstances.length;b++){d=a.model.meshInstances[b].mesh;e=a.model.meshInstances[b].node;h=a.model.meshes[d].vertices;d=a.model.meshes[d].indices;h=a.model.vertices[h];h=h.position.data;f=this.totalObjectScale(a.model,e);e=new Float32Array(h.length);k=h.length/3;for(c=0;c<k;c++)e[3*c]=h[3*c]*f[0],
e[3*c+1]=h[3*c+1]*f[1],e[3*c+2]=h[3*c+2]*f[2];c=d.length/3;for(h=0;h<c;h++)g=d[3*h],l=d[3*h+1],t=d[3*h+2],f=e[3*g],k=e[3*g+1],g=e[3*g+2],v=e[3*l],p=e[3*l+1],l=e[3*l+2],m=e[3*t],q=e[3*t+1],r=e[3*t+2],t=this.triNormal(f,k,g,v,p,l,m,q,r),f=this.triangleArea(f,k,g,v,p,l,m,q,r),0<f&&(n.x+=f*(1-Math.abs(t.x)),n.y+=f*(1-Math.abs(t.y)),n.z+=f*(1-Math.abs(t.z)))}n.x*=.5;n.y*=.5;n.z*=.5;return n}};
