FROM node:16-alpine

RUN apk update
RUN apk add --no-cache bash git gnupg docker curl wget binutils groff

RUN echo -e '\
  alias ll="ls -l"\n\
  export GPG_TTY=$(tty)\n\
  echo '' | gpg --clearsign\n\
  ' > /root/.bashrc

RUN echo -e '\
  source ~/.bashrc\n\
  ' > /root/.profile

RUN echo -e '\
  fs.inotify.max_user_watches=524288\n\
  ' >> /etc/sysctl.conf

# AWS CLI
RUN apk --no-cache add binutils curl \
  && GLIBC_VER=$(curl -s https://api.github.com/repos/sgerrand/alpine-pkg-glibc/releases/latest | grep tag_name | cut -d : -f 2,3 | tr -d \",' ',:) \
  && curl -sL https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub -o /etc/apk/keys/sgerrand.rsa.pub \
  && curl -sLO https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VER}/glibc-${GLIBC_VER}.apk \
  && curl -sLO https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VER}/glibc-bin-${GLIBC_VER}.apk \
  && apk add --no-cache \
  glibc-${GLIBC_VER}.apk \
  glibc-bin-${GLIBC_VER}.apk \
  && curl -sL https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o awscliv2.zip \
  && unzip awscliv2.zip \
  && aws/install \
  && rm -rf \
  awscliv2.zip \
  aws \
  /usr/local/aws-cli/v2/*/dist/aws_completer \
  /usr/local/aws-cli/v2/*/dist/awscli/data/ac.index \
  /usr/local/aws-cli/v2/*/dist/awscli/examples \
  && rm glibc-${GLIBC_VER}.apk \
  && rm glibc-bin-${GLIBC_VER}.apk \
  && rm -rf /var/cache/apk/*

# CDK
RUN yarn global add aws-cdk typescript
