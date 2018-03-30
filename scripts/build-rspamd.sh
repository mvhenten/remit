sudo yum install lua-devel
wget http://www.colm.net/files/ragel/ragel-6.10.tar.gz
tar -zxf ragel-6.10.tar.gz
cd ragel-6.10
./configure
make
git clone --recursive https://github.com/vstakhov/rspamd.git
mkdir -p rspamd.build
cd rspamd.build
cmake ../rspamd
make
# make install

wget http://www.colm.net/files/ragel/ragel-6.10.tar.gz

sudo yum install -y autoconf autogen intltool libtool
sudo yum install -y ghc-glib-devel ghc-glib
yum install pcre-devel
yum install libevent-devel
yum install libicu-devel
yum install kernel-devel