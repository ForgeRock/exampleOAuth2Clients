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
* [`node-passport-openidconnect`](./node-passport-openidconnect):<br>
  OAuth 2.0/OpenID Connect client showing how to protect profiles
  with a choice of OpenID Provider.<br>
  This Node.js application secures client credentials, access tokens, and ID tokens,
  communicating with the provider through a back channel.
  It keeps sensitive data away from the user-agent.
* [`openidm-ui-enduser-jso`](./openidm-ui-enduser-jso):<br>
  Single-page application showing OAuth 2.0 implicit flow protection
  for a public client in the user-agent.<br>Consider the implicit flow
  when the authorization code flow cannot be used effectively.
  For example, because the authorization server does not support
  cross-origin resource sharing (CORS).
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
1. Follow the README for the [ForgeRock Cloud Platform](
   https://github.com/ForgeRock/forgeops/tree/master/dev)
1. Follow the README for your chosen client in this repository.

**Important**

*   Match the branch versions of the `forgeops` and `exampleOAuth2Clients` repositories.<br>
    _Different branches are not compatible and not interoperable._
    The `master` branch is under active development. Older branches are more stable.
    For example, before trying the `exampleOAuth2Clients` [6.5 branch](https://github.com/ForgeRock/exampleOAuth2Clients/tree/6.5),
    check out a branch tracking the appropriate `forgeops` tag:
    `cd forgeops ; git fetch --all --tags --prune ; git checkout tags/6.5.1 -b 6.5.1`<br>
    The `forgeops-init` repository uses versioned directories rather than branches.
*   Your browser does not trust the server certificates used by default.
    The certificates are signed by a self-signed example CA certificate.
    You can either trust the CA&mdash;temporarily, because the example CA keys are published&mdash;or
    use a browser that you can run with an option to skip server certificate validation,
    such as `google-chrome --ignore-certificate-errors https://sample.iam.forgeops.com/am/console`

## About the Software

To use the example client applications as described in their README files,
you must access or set up a running instance of the ForgeRock
[ForgeRock Cloud Platform](https://github.com/ForgeRock/forgeops/tree/master/dev).
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
   |      ForgeRock Identity Platform (forgeops/dev)     |
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
with some disk space for the files and 4 GB free memory.
Should you choose to go beyond the basics,
full details are available in [_Installing Required Third-Party Software_](
  https://backstage.forgerock.com/docs/platform/6.5/release-notes/index.html#rnotes-before-env-sw),
a section in the ForgeRock Platform _DevOps Release Notes_.

To set up the ForgeRock Platform in Kubernetes, rely on these `git` repositories:

* [`ForgeRock Cloud Platform`](https://github.com/ForgeRock/forgeops/dev):<br>
  Reference implementations for the ForgeRock DevOps examples and Cloud Deployment Model.<br>
  Use this repository to download and set up ForgeRock Platform software
  into Kubernetes environment, whether that is local or cloud-based.
* [`exampleOAuth2Clients`](https://github.com/ForgeRock/exampleOAuth2Clients):<br>
  Example standards-based client applications.
