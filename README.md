# Example OAuth2 Clients

The client applications in this repository demonstrate standards-based profile management.
The user profiles are stored and served by ForgeRock software
that you deploy either locally on your computer or remotely in the cloud.
These example client applications protect access to the profiles
with standard OAuth 2.0 and OpenID Connect 1.0-based mechanisms.

## Choosing an Example Client

These example clients are provided:

* [`basic-vertx`](./basic-vertx):<br>
  OAuth 2.0 client showing how to protect access
  to profiles with a Vert.x application.
* [`iOS-AppAuth`](./iOS-AppAuth):<br>
  iOS native OAuth 2.0/OpenID Connect clients using the authorization code grant.<br>
  These are Swift applications using the AppAuth SDK for iOS,
  protecting access to user profile information.
* [`node-openid-client`](./node-openid-client):<br>
  OAuth 2.0/OpenID Connect client that uses audience restricted, resource-specific access tokens to address certain security and privacy concerns outlined by the best current practice.
  This Node.js application is built on top of the [openid-client-helper](https://github.com/ForgeRock/openid-client-helper) library.
* [`node-passport-openidconnect`](./node-passport-openidconnect):<br>
  OAuth 2.0/OpenID Connect client showing how to protect profiles
  with a choice of OpenID Provider.<br>
  This Node.js application secures client credentials, access tokens, and ID tokens,
  communicating with the provider through a back channel.
  It keeps sensitive data away from the user-agent.
* [`spa-appauth`](./spa-appauth):<br>
  Single-page application showing OpenID Connect-based single sign-on (SSO) and logout.

Each example client is self-contained, and fully described in its own README.

## Running Example Clients

1. Clone the following `git` repositories:
   * <https://github.com/ForgeRock/forgeops>
   * <https://github.com/ForgeRock/exampleOAuth2Clients>
1. Install third-party software for Kubernetes support:
   * Docker (<https://docs.docker.com/install/>)
   * `minikube` (<https://kubernetes.io/docs/tasks/tools/install-minikube/>)<br>
     (required only if you run everything locally on your laptop)
   * `kubectl` (<https://kubernetes.io/docs/tasks/tools/install-kubectl/>)
   * `skaffold` (<https://github.com/GoogleContainerTools/skaffold#installation>)
1. (Optional) XCode on macOS for the iOS examples.
1. Follow the DevOps Guide for the [ForgeRock Cloud Platform](
   https://backstage.forgerock.com/docs/forgeops/6.5/devops-guide-minikube/)
1. Run the "oauth2" profile with the 6.5 version of the platform:
```bash
    $ cd /path/to/forgeops
    $ bin/config.sh init --profile oauth2 --version 6.5
    $ skaffold dev -f skaffold-6.5.yaml -p oauth2
```
1. Follow the README for your chosen client in this repository.

## About the Software

To use the example client applications as described in their README files,
you must access or set up a running instance of the ForgeRock
[ForgeRock Cloud Platform](https://github.com/ForgeRock/forgeops).
The ForgeRock Cloud Platform deploys the ForgeRock Identity Platform
into a Kubernetes environment such as `minikube` on a laptop,
Amazon Elastic Container Service for Kubernetes (Amazon EKS), or
Google Kubernetes Engine (GKE), and others.
The ForgeRock Cloud Platform configures the ForgeRock Platform components
for use with the example clients in this repository.

The setup process builds the following layers,
starting from the bottom and working up:

```
   +-----------------------------------------------------+
   |      Example Clients (exampleOAuth2Clients)         |
   +-----------------------------------------------------+
   |      ForgeRock Identity Platform (forgeops)         |
   +-----------------------------------------------------+
   |      Kubernetes Support (minikube, GKE, EKS, others)|
   +-----------------------------------------------------+
```

You do not need to know DevOps, Kubernetes, or the ForgeRock Platform
to try the example clients.
Of course, if you run into any problems, debugging will be faster
if you are already familiar with DevOps and Kubernetes infrastructure,
the ForgeRock Platform components, and tools like
Docker, `kubectl` and `skaffold`.

To try the ForgeRock Platform in Kubernetes, first download and install
these freely available third-party software tools to work with Kubernetes
as described above.
If you install `minikube`,
you can run a local ForgeRock Platform development environment
with some disk space for the files and 8 GB free memory.
Should you choose to go beyond the basics,
full details are available in [_Installing Required Third-Party Software_](
  https://backstage.forgerock.com/docs/forgeops/6.5/devops-guide-minikube/#devops-implementation-env-sw),
a section in the ForgeRock Platform _DevOps Developer's Guide: Using Minikube_.

To set up the ForgeRock Platform in Kubernetes, rely on these `git` repositories:

* [`ForgeRock Cloud Platform`](https://github.com/ForgeRock/forgeops/):<br>
  Reference implementations for the ForgeRock DevOps examples and Cloud Deployment Model.<br>
  Use this repository to download and set up ForgeRock Platform software
  into Kubernetes environment, whether that is local or cloud-based.
* [`exampleOAuth2Clients`](https://github.com/ForgeRock/exampleOAuth2Clients):<br>
  Example standards-based client applications.
