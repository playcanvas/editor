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
            var result = unwrap.unwrapJsonModel(data, true, padding, true);

            postMessage({
                name: 'finish',
                id: id,
                data: data,
                area: result.totalArea
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
Unwrap.prototype={now:performance.now&&performance.timing?function(){return performance.now()}:Date.now,swap:function(a,b,c){var h=a[b];a[b]=a[c];a[c]=h},crossNormalize:function(a,b){var c=a.y*b.z-a.z*b.y,h=a.z*b.x-a.x*b.z,d=a.x*b.y-a.y*b.x,e=Math.sqrt(c*c+h*h+d*d);return{x:c/e,y:h/e,z:d/e}},triNormal:function(a,b,c,h,d,e,g,k,f){a-=h;b-=d;c-=e;h-=g;d-=k;f=e-f;e=b*f-c*d;f=c*h-a*f;a=a*d-b*h;b=Math.sqrt(e*e+f*f+a*a);return{x:e/b,y:f/b,z:a/b}},cubeFaceFromNormal:function(a){var b=Math.abs(a.x),c=Math.abs(a.y),
h=Math.abs(a.z);return b>=c&&b>=h?0>a.x?0:1:c>=b&&c>=h?0>a.y?2:3:0>a.z?4:5},boxUnwrap:function(a,b){this.now();var c=b.length/3,h,d,e,g,k,f,l,u,w,n=0,m;h=0;var p=[];for(m=0;6>m;m++)p[m]=[];for(m=0;m<a.length;m+=3)h=b[3*a[m]],d=b[3*a[m]+1],e=b[3*a[m]+2],g=b[3*a[m+1]],k=b[3*a[m+1]+1],f=b[3*a[m+1]+2],l=b[3*a[m+2]],u=b[3*a[m+2]+1],w=b[3*a[m+2]+2],h=this.triNormal(h,d,e,g,k,f,l,u,w),h=this.cubeFaceFromNormal(h),p[h].push(a[m]),p[h].push(a[m+1]),p[h].push(a[m+2]);for(m=1;6>m;m++);d=[];k=[];for(g=0;6>g;g++)for(h=
g+1;6>h;h++)for(m=0;m<p[g].length;m++){d=[];for(j=0;j<p[h].length;j++)p[g][m]===p[h][j]&&d.push(j);if(0<d.length){for(j=0;j<d.length;j++)p[h][d[j]]=c;k.push(p[g][m]);c++;n++}}for(m=0;m<n;m++)b.push(b[3*k[m]]),b.push(b[3*k[m]+1]),b.push(b[3*k[m]+2]);c=[];n=[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];for(g=offset=0;6>g;g++)for(m=n[g],f=this.crossNormalize(m,.5<Math.abs(m.y)?{x:1,y:0,z:0}:{x:0,y:1,z:0}),l=this.crossNormalize(m,f),f=this.crossNormalize(m,l),
m=0;m<p[g].length;m++)a[offset]=p[g][m],h=b[3*a[offset]],d=b[3*a[offset]+1],e=b[3*a[offset]+2],c[2*a[offset]]=f.x*h+f.y*d+f.z*e,c[2*a[offset]+1]=l.x*h+l.y*d+l.z*e,offset++;return{append:k,uv:c}},findCharts:function(a){this.now();var b,c,h,d=[],e=0,g;for(b=0;b<a.length;b++){h=3*Math.floor(b/3);e=Math.max(h,e);0===b%3&&(g=3);for(c=e;c<a.length;c++)a[b]===a[c]&&(c=3*Math.floor(c/3),this.swap(a,e,c),this.swap(a,e+1,c+1),this.swap(a,e+2,c+2),c+=2,e+=3,g--);2===b%3&&3>g&&(0<d.length&&d[d.length-1]>h?d[d.length-
1]=e:d.push(e))}for(b=a=0;b<d.length;b++)d[b]=(d[b]-3*a)/3,a+=d[b];return d},triangleArea:function(a,b,c,h,d,e,g,k,f){h-=a;d-=b;e-=c;g-=a;k-=b;f-=c;a=d*f-e*k;e=e*g-h*f;h=h*k-d*g;return.5*Math.sqrt(a*a+e*e+h*h)},calculateChartArea:function(a,b,c,h){var d,e,g,k,f,l,u,w,n,m,p,r,q,x,v,t=0,A,B,E=[],F=[],H=0,I=0,y,z,C,D,G=[];for(d=0;d<b.length;d++){g=b[d];B=A=0;y=z=99999;C=D=-99999;for(e=0;e<g;e++)k=t+e,f=a[3*k],l=a[3*k+1],k=a[3*k+2],u=c[3*f],w=c[3*f+1],n=c[3*f+2],m=c[3*l],p=c[3*l+1],r=c[3*l+2],q=c[3*k],
x=c[3*k+1],v=c[3*k+2],A+=this.triangleArea(u,w,n,m,p,r,q,x,v),u=h[2*f],f=h[2*f+1],w=h[2*l],l=h[2*l+1],n=h[2*k],k=h[2*k+1],B+=this.triangleArea(u,f,0,w,l,0,n,k,0),y=Math.min(y,u),y=Math.min(y,w),y=Math.min(y,n),z=Math.min(z,f),z=Math.min(z,l),z=Math.min(z,k),C=Math.max(C,u),C=Math.max(C,w),C=Math.max(C,n),D=Math.max(D,f),D=Math.max(D,l),D=Math.max(D,k);0===A&&(B=A=.01,C=y+.01,D=z+.01);isNaN(A)&&(B=A=.01,C=y+.01,D=z+.01);0===B&&(B=.01,C=y+.01,D=z+.01);H+=A;E.push(A);t+=g;G[d]={x:0,y:0,z:0,w:0};G[d].x=
y;G[d].y=z;G[d].z=C-G[d].x;G[d].w=D-G[d].y;I+=B;F.push(B)}return{areas:E,areasT:F,totalArea:H,totalAreaT:I,aabbs:G}},normalizeCharts:function(a,b,c,h,d,e){a=c.areas;h=c.areasT;e=c.totalArea;var g=[];for(c=0;c<b.length;c++)d=.8*Math.sqrt(1/h[c]*(a[c]/e)),g.push(d);return g},fits:function(a,b){return a.z<=b.z&&a.w<=b.w},fitsExactly:function(a,b){return a.z===b.z&&a.w===b.w},findHoles:function(a,b,c,h,d,e,g,k){var f;c=Math.floor((a.aabb.z*this.resolution-2*this.padding)/4);var l=Math.floor((a.aabb.w*
this.resolution-2*this.padding)/4);if(0>=c||0>=l||1E3<c||1E3<l)return[];var u=new Uint8Array(c*l),w=0;for(f=0;f<d.length&&f!==b;f++)w+=d[f];var n=d[b],m=g[b].x*k,p=g[b].y*k,r=g[b].z*k,q=g[b].w*k,x,v,t;for(f=0;f<n;f++){d=e[3*(w+f)];g=e[3*(w+f)+1];b=e[3*(w+f)+2];x=h[2*d]*k;v=h[2*d+1]*k;var A=h[2*g]*k,B=h[2*g+1]*k,E=h[2*b]*k,F=h[2*b+1]*k;x=(x-m)/r;A=(A-m)/r;E=(E-m)/r;v=(v-p)/q;B=(B-p)/q;F=(F-p)/q;g=b=99999;t=d=-99999;b=Math.min(b,x);b=Math.min(b,A);b=Math.min(b,E);g=Math.min(g,v);g=Math.min(g,B);g=Math.min(g,
F);d=Math.max(d,x);d=Math.max(d,A);d=Math.max(d,E);t=Math.max(t,v);t=Math.max(t,B);t=Math.max(t,F);b*=c;d*=c;g*=l;t*=l;b=Math.floor(b)-this.padding;g=Math.floor(g)-this.padding;d=Math.floor(d)+this.padding;t=Math.floor(t)+this.padding;0>b&&(b=0);b>=c&&(b=c-1);0>g&&(g=0);g>=l&&(g=l-1);0>d&&(d=0);d>=c&&(d=c-1);0>t&&(t=0);t>=l&&(t=l-1);for(v=g;v<=t;v++)for(x=b;x<=d;x++)u[v*c+x]=255}b=Math.max(c,l);h=[u];f=c;d=l;e=[f];k=[d];for(g=0;8<b;){n=Math.floor(f/2);m=Math.floor(d/2);w=new Uint8Array(n*m);for(v=
0;v<m;v++)for(x=0;x<n;x++){for(q=b=0;2>q;q++)for(r=0;2>r;r++)b=Math.max(b,h[g][(2*v+q)*f+(2*x+r)]);w[v*n+x]=b}b=Math.max(n,m);f=n;d=m;g++;h[g]=w;e[g]=n;k[g]=m}p=[];for(f=h.length-1;0<=f;f--)for(n=e[f],m=k[f],w=h[f],A=c/n,B=l/m,v=0;v<m;v++)for(x=0;x<n;x++)if(0===w[v*n+x]){g=Math.floor(x*A);t=Math.floor(v*B);d=b=g;g=t;for(var E=b,F=g,H=d,I=t,y=!0,z=0,C=!0;y;){if(0>b||0>g||d>c-1||t>l-1)y=!1;else for(q=g;q<=t;q++){for(r=b;r<=d;r++)if(0<u[q*c+r]){y=!1;break}if(!y)break}if(y)for(r=0;r<p.length;r++)if(!(p[r].maxx<
b||p[r].minx>d||p[r].maxy<g||p[r].miny>t)){y=!1;break}if(!y){if(C)break;b=E;g=F;d=H;t=I;z++;if(6>z)y=!0;else break}C=!1;E=b;F=g;H=d;I=t;0===z?(g--,b--):1===z?(t++,d++):2===z?b--:3===z?g--:4===z?d++:5===z&&t++}C||p.push({minx:b,miny:g,maxx:d,maxy:t})}for(f=0;f<p.length;f++)u={x:0,y:0,z:0,w:0},u.x=p[f].minx/c*a.aabb.z+a.aabb.x,u.y=p[f].miny/l*a.aabb.w+a.aabb.y,u.z=(p[f].maxx-p[f].minx)/c*a.aabb.z,u.w=(p[f].maxy-p[f].miny)/l*a.aabb.w,p[f]={aabb:u,id:-1,child:[],leaf:!0,insideHole:!0};return p},insertToAtlas:function(a,
b,c,h,d,e,g,k){if(a.leaf){if(0<=a.id||!this.fits(c,a.aabb))return null;if(this.fitsExactly(c,a.aabb))return a.id=b,this.fillHoles&&(b=this.findHoles(a,b,c,h,d,e,g,k),0<b.length&&(a.leaf=!1,a.child=b)),a;var f={x:0,y:0,z:0,w:0},l={x:0,y:0,z:0,w:0};a.aabb.z-c.z>a.aabb.w-c.w?(f.x=a.aabb.x,f.y=a.aabb.y,f.z=c.z,f.w=a.aabb.w,l.x=a.aabb.x+c.z,l.y=a.aabb.y,l.z=a.aabb.z-c.z,l.w=a.aabb.w):(f.x=a.aabb.x,f.y=a.aabb.y,f.z=a.aabb.z,f.w=c.w,l.x=a.aabb.x,l.y=a.aabb.y+c.w,l.z=a.aabb.z,l.w=a.aabb.w-c.w);a.leaf=!1;
a.child=[];a.child[0]={aabb:f,id:-1,child:[],leaf:!0,test:!1};a.child[1]={aabb:l,id:-1,child:[],leaf:!0,test:!1};return this.insertToAtlas(a.child[0],b,c,h,d,e,g,k)}for(f=0;f<a.child.length;f++)if(l=this.insertToAtlas(a.child[f],b,c,h,d,e,g,k))return l;return null},transformUv:function(a,b){a.x=a.x*b.x+b.z;a.y=a.y*b.y+b.w},packCharts:function(a,b,c,h,d,e,g){this.now();var k,f={aabb:{x:0,y:0,z:1,w:1},id:-1,child:[],leaf:!0,test:!1},l=[],u=[];for(k=0;k<b.length;k++)u[k]=k;u.sort(function(a,b){return Math.max(c[b].z*
e[b],c[b].w*e[b])-Math.max(c[a].z*e[a],c[a].w*e[a])});for(var w=0,n=0,m=0,p=0,r=99999,q,x=0;x<c.length;x++){k=u[x];q={x:c[k].x,y:c[k].y,z:c[k].z,w:c[k].w};q.x=q.x*e[k]*g;q.y=q.y*e[k]*g;q.z=q.z*e[k]*g;q.w=q.w*e[k]*g;q.z+=2*this.paddingUv;q.w+=2*this.paddingUv;var v=this.insertToAtlas(f,k,q,d,b,a,c,e[k]*g);v?(l[k]=v.aabb,v.insideHole||(n+=l[k].z*l[k].w)):w+=q.z*q.w;m=Math.max(m,q.z);p=Math.max(p,q.w);r=Math.min(r,q.z)}h.usedArea=n;h.maxWidth=m;h.maxHeight=p;h.minWidth=r;if(0<w)return h.notFitted=w,
!1;for(k=0;k<l.length;k++)l[k].z>2*this.paddingUv&&l[k].w>2*this.paddingUv&&(l[k].x+=this.paddingUv,l[k].y+=this.paddingUv,l[k].z-=2*this.paddingUv,l[k].w-=2*this.paddingUv);a=[];for(k=0;k<c.length;k++)q={x:c[k].x,y:c[k].y,z:c[k].z,w:c[k].w},q.x=q.x*e[k]*g,q.y=q.y*e[k]*g,q.z=q.z*e[k]*g,q.w=q.w*e[k]*g,b=l[k].z/q.z,h=l[k].w/q.w,a.push({x:b,y:h,z:l[k].x-q.x*b,w:l[k].y-q.y*h});return{scaleOffset:a,packedAabbs:l}},transformUv2:function(a,b,c,h){a.x=a.x*b*c;a.y=a.y*b*c;return this.transformUv(a,h)},finalTransformUv:function(a,
b,c,h,d,e){var g,k,f,l,u,w={x:0,y:0},n={x:0,y:0},m={x:0,y:0},p=0,r=[];for(g=0;g<b.length;g++){chartTris=b[g];for(k=0;k<chartTris;k++)f=p+k,l=a[3*f],u=a[3*f+1],f=a[3*f+2],w.x=c[2*l],w.y=c[2*l+1],n.x=c[2*u],n.y=c[2*u+1],m.x=c[2*f],m.y=c[2*f+1],r[l]||this.transformUv2(w,h[g],d,e[g]),r[u]||this.transformUv2(n,h[g],d,e[g]),r[f]||this.transformUv2(m,h[g],d,e[g]),c[2*l]=w.x,c[2*l+1]=w.y,c[2*u]=n.x,c[2*u+1]=n.y,c[2*f]=m.x,c[2*f+1]=m.y,r[l]=!0,r[u]=!0,r[f]=!0;p+=chartTris}},totalObjectScale:function(a,b){for(var c=
a.nodes[b].scale,h=c[0],d=c[1],c=c[2],e=a.parents[b],g;0<=e;)g=a.nodes[e].scale,h*=g[0],d*=g[1],c*=g[2],e=a.parents[e];return[h,d,c]},unwrapJsonModel:function(a,b,c,h){this.resolution=1024;this.padding=c;this.paddingUv=this.padding/this.resolution;this.fillHoles=h;var d,e,g,k,f;c=[];var l=[];h=[];var u=[],w=[],n=0,m,p,r,q=[],x=[],v,t;d=.025;f=[];for(d=0;d<a.model.meshInstances.length;d++)if(void 0===f[d])for(f[d]=-1,e=d+1;e<a.model.meshInstances.length;e++)a.model.meshInstances[d].mesh===a.model.meshInstances[e].mesh&&
(f[d]=0,f[e]=1);for(d=0;d<a.model.meshInstances.length;d++){this.progress&&this.progress(d/a.model.meshInstances.length*30);if(this.cancel)return;f=a.model.meshInstances[d].mesh;e=a.model.meshInstances[d].node;p=a.model.meshes[f].vertices;g=a.model.meshes[f].indices;r=a.model.vertices[p];k=r.position.data;f=r.texCoord0?r.texCoord0.data:null;m=this.totalObjectScale(a.model,e);b&&(f=null);e={uv:f,append:[]};f||(e=this.boxUnwrap(g,k),f=e.uv);k=e.append;for(t in r)if("position"!==t&&r.hasOwnProperty(t)){var A=
r[t].data,B=r[t].components;for(g=0;g<k.length;g++)for(e=0;e<B;e++)A.push(A[k[g]*B+e])}if(q[p])for(v in f)q[p][v]=f[v];else q[p]=f;x[p]=m}for(d=0;d<a.model.vertices.length;d++){r=a.model.vertices[d];k=r.position.data;f=q[d];m=x[d];w[d]=k.length/3;for(e=0;e<k.length/3;e++)l.push(k[3*e]*m[0]),l.push(k[3*e+1]*m[1]),l.push(k[3*e+2]*m[2]);for(e=0;e<f.length;e++)h.push(f[e]);u[d]=n;n+=k.length/3}for(d=0;d<a.model.meshInstances.length;d++)for(f=a.model.meshInstances[d].mesh,p=a.model.meshes[f].vertices,
g=a.model.meshes[f].indices,e=0;e<g.length;e++)c.push(g[e]+u[p]);v=this.findCharts(c);b=this.calculateChartArea(c,v,l,h);l=this.normalizeCharts(c,v,b,h);n=1;if(!this.cancel){t=this.packCharts(c,v,b.aabbs,b,h,l,n);for(this.progress&&this.progress(30);!t;){if(this.cancel)return;n/=1+b.notFitted;t=this.packCharts(c,v,b.aabbs,b,h,l,n)}for(this.progress&&this.progress(50);;){if(this.cancel)return;d=(1-b.usedArea)/5;t=n;n+=d;if(n===t)break;t=this.packCharts(c,v,b.aabbs,b,h,l,n);if(!t)break}this.progress&&
this.progress(90);n-=d;t=this.packCharts(c,v,b.aabbs,b,h,l,n);d=t.scaleOffset;this.finalTransformUv(c,v,h,l,n,d);for(d=0;d<a.model.vertices.length;d++){f=[];for(e=0;e<2*w[d];e++)f.push(h[2*u[d]+e]);r=a.model.vertices[d];r.texCoord1={data:f,components:2,type:"float32"}}this.progress&&this.progress(100);return{packedAabbs:t.packedAabbs,totalArea:b.totalArea}}},calculateAreaOfJsonModel:function(a){var b,c,h,d,e,g,k,f,l,u,w,n,m,p,r=0;for(b=0;b<a.model.meshInstances.length;b++){d=a.model.meshInstances[b].mesh;
e=a.model.meshInstances[b].node;h=a.model.meshes[d].vertices;d=a.model.meshes[d].indices;h=a.model.vertices[h];h=h.position.data;g=this.totalObjectScale(a.model,e);e=new Float32Array(h.length);k=h.length/3;for(c=0;c<k;c++)e[3*c]=h[3*c]*g[0],e[3*c+1]=h[3*c+1]*g[1],e[3*c+2]=h[3*c+2]*g[2];c=d.length/3;for(h=0;h<c;h++)f=d[3*h],l=d[3*h+1],u=d[3*h+2],g=e[3*f],k=e[3*f+1],f=e[3*f+2],w=e[3*l],n=e[3*l+1],l=e[3*l+2],m=e[3*u],p=e[3*u+1],u=e[3*u+2],r+=this.triangleArea(g,k,f,w,n,l,m,p,u)}return r}};
