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
  def messageName = 'Web View'
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

  env.PATH = "${tool 'dli-gradle'}/bin:${tool 'dli-node'}/bin:${env.PATH}"

  stage('Checkout') {
    checkout scm
  }

  def gitlog = ''
  def changeLogs = showChangeLogs()
  if (changeLogs['committer'].length() != 0) {
    gitlog = changeLogs['committer']
  } else {
    // jenkinsのchangeLogsがゼロの場合があるのでその場合はコマンドで最終コミットを出力する
    sh 'mkdir -p build/jenkins'
    sh 'git log --no-color --first-parent -n 1 | grep -v "^Date.*" | grep -v "^commit.*" > build/jenkins/git.log'
    gitlog = readFile('build/jenkins/git.log')
  }

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
  sh 'git clean -xdf'

  stage 'build'
  ansiColor('xterm') {
    try {
      sh 'gradle checkTsFileName release'
    } catch (Exception ex) {
      slackSend channel: '#jenkins', color: 'danger', message: error, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
      slackSend channel: '#acn-developer', color: 'danger', message: error, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
      throw ex
    }
  }

/*
  if (env.PROFILE != 'local') {
    stage('CheckMobile'){
      sh 'mkdir -p build'
      def downloadOldMobileZip = false
      try {
        sh 'gradle unzipOldMobile'
        downloadOldMobileZip = true
      } catch (Exception ex) {
        mobileRelease = true
        def warnmsg = """\
              |WARN: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE}) 前回のモバイル資源がありません。 :builderr:
              |モバイル資源のリリースが必要かどうか確認してください。

              |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})
        """.stripMargin()
        slackSend channel: '#acn-developer', color: 'danger', message: warnmsg, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
      }

      if (downloadOldMobileZip) {
        try {
          sh 'diff -rqb --exclude=version.json build/oldmobile/mobile dist/mobile > dist/mobile_diff.txt'
          echo 'mobile資源には変更がありません'
        } catch (Exception ex) {
          echo 'mobile資源に差分があります'
        }

        def checkfile = readFile('dist/mobile_diff.txt')
        if (checkfile.length() != 0) {
          mobileRelease = true
          def newVersionFile = readFile('dist/mobile/version.json')
          def oldVersionFile = readFile('build/oldmobile/mobile/version.json')
          echo checkfile
          def warnmsg = """\
                |WARN: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE}) モバイル資源に変更があります。 :builderr:
                |モバイル資源のリリースが必要になります。

                |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

                |```
                |${checkfile}
                |```

                |*new version file*
                |```
                |${newVersionFile}
                |```

                |*old version file*
                |```
                |${oldVersionFile}
                |```

          """.stripMargin()
          slackSend channel: '#acn-developer', color: 'warning', message: warnmsg, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
        }
      }
    }
  }
  try {
    if (env.DEPLOY == 'true') {
      stage 'Deploy'
      sh 'gradle deploy'
    }
  } catch (Exception ex) {
    slackSend channel: '#jenkins', color: 'danger', message: deployError, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    slackSend channel: '#acn-developer', color: 'danger', message: deployError, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    throw ex
  }

  if (env.DEPLOY == 'false') {
    // sonarはnightlyのみに適用する
    if (['nightly', 'nightly_next'].contains(env.PROFILE) && env.DEPLOY == 'false') {
      sh 'npm run report:sonar'
      sh 'gradle sonar'
    }

    stage 'CheckCRLF'
    try {
      sh 'find . -type d -name "node_modules" -prune -o -type f -name "*" ! -name "*.bat" ! -name "*.MF" -print | xargs file | grep -E "((with CRLF line terminators)|(BOM))" > dist/crlfcheck.txt'
    } catch (Exception ex) {
      echo '改行文字にCRLFは含まれてません'
    }
    def crlfcheck = readFile('dist/crlfcheck.txt')
    if (crlfcheck.length() != 0) {
      currentBuild.result = 'UNSTABLE'
      echo 'ファイルにCRLFが含まれています！'
      echo crlfcheck
      def crlfwarning = """\
            |BAD: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE})に改行コードCRLFが含まれています。 :builderr:

            |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

            |```
            |${crlfcheck}
            |```

      """.stripMargin()
      slackSend channel: '#acn-developer', color: 'danger', message: crlfwarning, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    }

    stage 'CheckLeftMost'
    try {
      sh 'find . -type d -name "node_modules" -prune -o -type f -name "package.json" | xargs cat | grep -E "\\"\\^[0-9]*\\.[0-9]*\\.[0-9]*\\"" > dist/leftmost.txt'
    } catch (Exception ex) {
      echo 'キャレット表記は含まれてません'
    }
    def leftmost = readFile('dist/leftmost.txt')
    if (leftmost.length() != 0) {
      currentBuild.result = 'UNSTABLE'
      echo 'package.jsonにキャレット表記が含まれています！'
      echo leftmost
      def crlfwarning = """\
            |BAD: ${ messageName }(${ env.BRANCH_NAME }:${ env.PROFILE })にpackage.jsonにセマンティックバージョニング(キャレット表記)が含まれています。 :builderr:

            |Job '${ env.JOB_NAME } [${ env.BUILD_NUMBER }]' (${ env.BUILD_URL })

            |```
            |${leftmost}
            |```

      """.stripMargin()
      slackSend channel: '#acn-developer', color: 'danger', message: crlfwarning, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    }
  }

  stage('Archiver') {
    archiveArtifacts artifacts: 'dist/*.zip,dist/*.MD5', fingerprint: true
    // リリースノートを配置
    if (sharedEnvironment.contains(env.PROFILE) || ['dev', 'dev_next'].contains(env.PROFILE)) {
      sh 'env ADEP_MD_DIR=release_note ADEP_MD_HTML_OUT=build/release_note adep convert-md-to-html'
      sh 'gradle deployReleseNote'
    }
  }

  try {
    if (sharedEnvironment.contains(env.PROFILE)) {
      stage('Release') {
        if (mobileRelease) {
          sh 'gradle mobileDeploy'
        }
        sh 'mkdir -p build/jenkins'
        sh 'adep latest-version > build/jenkins/version.txt'
        withCredentials([[$class: 'UsernamePasswordMultiBinding',
          credentialsId: 'azure-blob',
          usernameVariable: 'DLI_STORAGE_NAME',
          passwordVariable: 'DLI_ACCESS_KEY']]) {
            def zip = "dist/server_${ profile }.zip"
            def md5 = "dist/server_${ profile }.zip.MD5"
            sh "ruby jenkins/rb/azure-uplpad.rb ${ zip } ${ md5 } >> build/jenkins/blob_name.txt"
        }
      }
    }
  } catch (Exception ex) {
    slackSend channel: '#jenkins', color: 'danger', message: releaseError, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    slackSend channel: '#acn-release', color: 'danger', message: releaseError, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    throw ex
  }

  if (env.GIT_ROOT != null) {
    currentBuild.description = "${env.GIT_ROOT}/${env.BRANCH_NAME}/${env.PROFILE}"
  }

  if (currentBuild.result == 'UNSTABLE') {
    slackSend channel: '#jenkins', color: 'warning', message: warning, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    slackSend channel: '#acn-developer', color: 'warning', message: warning, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
  } else if (sharedEnvironment.contains(env.PROFILE)) {
    def versionText = readFile('build/jenkins/version.txt').replaceAll(/\n/, '')
    def blobName = readFile('build/jenkins/blob_name.txt').split("\n")
    def mobileUrl = "<https://wb026001.acpaws-dev.com/webview/mobile/${env.PROFILE}/mobile_${env.PROFILE}.zip|zip> <https://wb026001.acpaws-dev.com/webview/mobile/${env.PROFILE}/mobile_${env.PROFILE}.zip.MD5|md5>"
    def releaseSuccess = """\
          |FINISH: ${ messageName }(${env.BRANCH_NAME}:${env.PROFILE}:${versionText})のリリース準備が完了しました。:truck:
          |リリース漏れを防ぐため必ず <https://wb026001.acpaws-dev.com/releasenote/webview/|リリースノート> の内容を確認して下さい。

          |Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})

          |*モバイルリリース*
          |${ mobileRelease? mobileUrl : '不要' }

          |```
          |ファイル整合性検証は以下のコマンドで表示されたハッシュ値と${blobName[1]}に記載されているハッシュ値で検証可能です。

          |windows
          |CertUtil -hashfile ${blobName[0]} MD5

          |linux
          |md5sum -c ${blobName[1]}
          |```
          |デプロイ設定(resource.yml)

          |```
          |profile: ${ env.PROFILE }

          |core:
          | webview:
          |   archive: ${ blobName[0] }
          |   md5: ${ blobName[1] }
          |```

    """.stripMargin()
    slackSend channel: '#jenkins', color: 'good', message: releaseSuccess, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    slackSend channel: '#acn-release-completed', color: 'good', message: releaseSuccess, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    currentBuild.description = "${env.PROFILE}"
  } else if (env.DEPLOY == 'true') {
    slackSend channel: '#jenkins', color: 'good', message: deployAndBuildSuccess, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    if (['dev'].contains(env.PROFILE)) {
      devMessage = "${ messageName }(${ env.PROFILE })のデプロイが完了しました。\n${ mobileRelease ? 'モバイルアプリ更新が必要です\n':'' }変更内容は${ releaseNoteLink }を確認して下さい。"
      slackSend channel: itaRoom, color: 'good', message: devMessage, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
    }
  } else {
    slackSend channel: '#jenkins', color: 'good', message: success, teamDomain: slackTeamDomain, tokenCredentialId: 'slack'
  }
  */
}
