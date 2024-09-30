# Build it like this:
# docker build --tag webportal-service:improve-build .

# Run it like this:
# docker run -p 80:80 -v /absolute/location/of/your/export.zip:/home/specify/webportal-installer/specify_exports/export.zip webportal-service:improve-build



FROM ubuntu:20.04 AS specify_base_ubuntu

LABEL maintainer="Specify Collections Consortium <github.com/specify>"

ENV DEBIAN_FRONTEND=noninteractive

# Get Ubuntu packages
RUN apt-get update && apt-get -y install \
   curl \
   default-jre \
        git \
   lsof \
   make \
   python2 \
   python-lxml \
   unzip \
   wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

FROM specify_base_ubuntu AS webportal

# Get Web Portal
COPY . /home/specify/webportal-installer
WORKDIR /home/specify/webportal-installer/

# Build the Solr app
RUN cd /home/specify/webportal-installer/  && make clean-all && make build-all && make build-html

# Run Solr in foreground
# Give Solr time to get up and running
# Import .zip file
CMD ./build/bin/solr start -force -p 8983 \
   && sleep 10 \
   && make load-data \
   # && ./build/bin/solr create_core -c herbarium -p 8983 -force \
   # && curl 'http://localhost:8983/solr/herbarium/update?commit=true' --data-binary @./build/cores/herbarium/PortalFiles/PortalData.csv  -H 'Content-type:application/csv' \
   && sleep infinity
