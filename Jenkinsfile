@NonCPS
def showChangeLogs() {
  def changeLogSets = currentBuild.rawBuild.changeSets
  def committerBuf = new StringBuilder()
  def filesBuf  = new StringBuilder()
  def filesArry = []
  echo "changeLogSets.size() = ${ changeLogSets.size() }"
  for (changeLogSet in changeLogSets) {
     for (entry in changeLogSet.items) {
          committerBuf.append "${ entry.comment.replaceAll(/\n/, ' ') } ${entry.author}\n"
          for (file in new ArrayList(entry.affectedFiles)) {
              filesBuf.append "  ${file.editType.name} ${file.path}"
              filesArry << "${file.path}".toString()
          }
      }
  }

  return ['committer':committerBuf.toString(), 'fileStatus':filesBuf.toString(), 'files': filesArry]
}

node {
  def slackTeamDomain = 'dikenko'
  def itaRoom = '#sprint3-4-ita'
  def messageName = 'Jenkins Test Project'
  def releaseNoteLink = '<https://wb026001.acpaws-dev.com/releasenote/webview/|リリースノート>'
  def sharedEnvironment = ['test', 'test_next', 'staging', 'prod', 'pt', 'prom', 'biz']
  def mobileRelease = false

  if (env.PROFILE == null) {
    switch (env.BRANCH_NAME) {
      case 'develop':
        env.PROFILE = 'nightly'
        break
      case ~/release\/v[0-9]*\.[0-9]*\.[0-9]*$/:
        env.PROFILE = 'dev'
        break
      case 'master':
        if (!env.PROFILE) {
          env.PROFILE = 'local'
        }
        // masterは納品物なのでワークスペースを完全にクリアする
        deleteDir()
        sh 'ls -la'
        break
      default:
        env.PROFILE = 'local'
        break
    }
  }

  if (env.DEPLOY == null) {
    env.DEPLOY = 'false'
    if (['dev', 'dev_next'].contains(env.PROFILE)) {
      env.DEPLOY = 'true'
    }
  }

  if (env.JOB_NAME ==~ /.*_next.*/ && env.PROFILE != 'local' && !env.PROFILE.endsWith('_next')) {
    env.PROFILE = "${env.PROFILE}_next"
  }

  if (env.DEPLOY && ['dev'].contains(env.PROFILE)) {
      devMessage = "${ messageName }(${ env.PROFILE })のデプロイを開始します。"
      slackSend channel: itaRoom, color: 'good', message: devMessage, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
  }

  echo "BRANCH_NAME=${env.BRANCH_NAME} PROFILE=${env.PROFILE} DEPLOY=${env.DEPLOY}"

  // sh 'env > env.txt'
  // echo readFile('env.txt')

  // env.PATH = "${tool 'dli-gradle'}/bin:${tool 'dli-node'}/bin:${env.PATH}"

  stage('Checkout') {
    checkout scm
  }

  def gitlog = ''

  def success = """\
        |FINISH: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE})のビルドが成功しました。:grinning:

        |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

        |```
        |${gitlog}
        |```

  """.stripMargin()

  def deployAndBuildSuccess = """\
        |FINISH: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE})のビルド/デプロイが成功しました。:grinning: :truck:
        |<https://wb026001.acpaws-dev.com/releasenote/webview/|リリースノート> の内容を確認して下さい。

        |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

        |*モバイルダウンロード*
        |https://wb026001.acpaws-dev.com/webview/mobile/${env.PROFILE}/mobile_${env.PROFILE}.zip
        |https://wb026001.acpaws-dev.com/webview/mobile/${env.PROFILE}/mobile_${env.PROFILE}.zip.MD5

        |```
        |${gitlog}
        |```

  """.stripMargin()

  def warning = """\
        |WARNING: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE})のビルドが不安定です。:joy:

        |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

        |```
        |${gitlog}
        |```

  """.stripMargin()

  def error = """\
        |BAD: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE})のビルドが失敗しました。 :builderr:

        |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

        |```
        |${gitlog}
        |```

  """.stripMargin()

  def deployError = """\
        |BAD: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE})のデプロイが失敗しました。 :builderr:

        |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

        |```
        |${gitlog}
        |```

  """.stripMargin()

  def releaseError = """\
        |FINISH: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE})のリリース準備が失敗しました。:builderr:

        |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

        |```
        |${gitlog}
        |```

  """.stripMargin()

  stage 'Clean'
  bat 'git clean -xdf'

  stage 'build'
  ansiColor('xterm') {
    try {
      bat 'gradle checkTsFileName release'
    } catch (Exception ex) {
      // slackSend channel: '#jenkins', color: 'danger', message: error, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
      // slackSend channel: '#acn-developer', color: 'danger', message: error, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
      throw ex
    }
  }
}
