FROM vertx/vertx3:3.5.4

ENV VERTICLE_NAME app.groovy
ENV VERTICLE_HOME /usr/verticles
ENV VERTX_HOME /usr/local/vertx
ENV VERTX_OPTS '-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005 -Dvertx.disableFileCaching=true -Dvertx.disableFileCPResolving=true'

EXPOSE 8888
EXPOSE 5005

RUN wget http://central.maven.org/maven2/org/slf4j/slf4j-api/1.7.25/slf4j-api-1.7.25.jar -O $VERTX_HOME/lib/slf4j-api-1.7.25.jar -q

COPY src $VERTICLE_HOME

WORKDIR $VERTICLE_HOME
ENTRYPOINT ["sh", "-c"]
CMD ["vertx run $VERTICLE_NAME -cp $VERTICLE_HOME/*"]
