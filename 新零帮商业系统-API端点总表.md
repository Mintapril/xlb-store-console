# 新零帮商业系统 API 端点总表

> 静态提取自前端 bundle（共 1417 个端点，聚合为 665 个实体）。Base URL：`https://gdp.xlbsoft.com`，除标注外均为 POST JSON。


## `/bi`（报表, 17 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.bi.homepage.card` | find |
| `hxl.bi.homepage.card.detail` | find |
| `hxl.bi.homepage.membercard` | find |
| `hxl.bi.homepage.pospayment` | find |
| `hxl.bi.homepage.waithandle` | find |
| `hxl.bi.org.psd` | find |
| `hxl.bi.poscollection.operatorsummary` | export, find |
| `hxl.bi.poscollection.otherinout.detail` | find |
| `hxl.bi.poscollection.shiftsummary` | export, find |
| `hxl.bi.poscollection.storebizsummary` | export, find |
| `hxl.bi.poscollection.storesummary` | export, find |
| `hxl.bi.store.category.forecast` | find |
| `hxl.bi.store.category.forecast.find` | all |

## `/bms`（资金分账, 1 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.bms.merchant.channel.file` | upload |

## `/center`（公共, 10 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.center.area` | find |
| `hxl.center.category.tree` | find |
| `hxl.center.company` | find |
| `hxl.center.company.auth` | find |
| `hxl.center.organization.tree` | find |
| `hxl.center.roleassociation.userlevel` | find |
| `hxl.center.roleassociation.userposition` | find |
| `hxl.center.store.delivery` | find |
| `hxl.center.user.roster` | find |
| `hxl.center.usersequence` | find |

## `/erp`（ERP业务, 293 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.erp.(root)` |  |
| `hxl.erp.app.calendar` | find |
| `hxl.erp.autoreceiveconfig` | batchdelete, batchupdate, page, save |
| `hxl.erp.bankaccount` | find |
| `hxl.erp.basket` | page |
| `hxl.erp.basketorder` | approve, audit, batchdelete, getoutnum, handle, page, read, reaudit, reject, save, update |
| `hxl.erp.brandlevel` | read |
| `hxl.erp.businessindex` | export, find, import, update |
| `hxl.erp.businessindexanalysis.area` | export, find |
| `hxl.erp.businessindexanalysis.store` | export, find |
| `hxl.erp.businessindextemplate` | download |
| `hxl.erp.businessscope.itemcategory` | delete, find, save |
| `hxl.erp.cardtype` | find |
| `hxl.erp.cashbank` | find |
| `hxl.erp.category` | find |
| `hxl.erp.couponcategory` | find |
| `hxl.erp.coupontype` | page |
| `hxl.erp.deliverycenterstore` | page |
| `hxl.erp.deliveryincheckorder` | receive |
| `hxl.erp.deliveryinorder` | audit, batchaudit, batchdelete, copy, createbydeliveryoutorder, createstoreapplicationorder, page, print, read, reaudit, reverse, save, update |
| `hxl.erp.deliveryinorder.file` | upload |
| `hxl.erp.deliveryinorder.item` | page |
| `hxl.erp.deliveryoutorder` | audit, batchaudit, batchcopy, batchdelete, batchprint, batchread, batchrefreshtaxrate, batchreverse, batchsave, createbyreceiveorder, createbyrequestorder, deliveryprice, page, pageforin, print, read, save, update |
| `hxl.erp.deliveryoutorder.batchrefreshtaxrate` | valid |
| `hxl.erp.deliveryoutorder.item` | page |
| `hxl.erp.deliveryoutorder.tmp` | reaudit |
| `hxl.erp.deliveryparam` | read |
| `hxl.erp.deliveryspecialprice.item` | batch |
| `hxl.erp.directsupplypoint.config` | exist |
| `hxl.erp.documentrelate` | find |
| `hxl.scm.erp.purchaseplandetail` | export, page, update |
| `hxl.scm.erp.stockplan` | update |
| `hxl.erp.feeitem` | cancel, delete, find, save, update |
| `hxl.erp.file` | delete, import |
| `hxl.erp.forcedelivery.item` | find |
| `hxl.erp.frontwarhouserelation` | read, save, update |
| `hxl.erp.frontwarhouserelation.item` | page |
| `hxl.erp.frontwarhouserelation.item.template` | download |
| `hxl.erp.functionfiltertemplate` | delete, find, save, update |
| `hxl.erp.item` | page, read |
| `hxl.erp.itemstocklog.storeitemsummary` | find |
| `hxl.erp.itemtemplate` | read |
| `hxl.erp.labour.code` | get |
| `hxl.erp.paymentmethod` | delete, find, initialize, save, update |
| `hxl.erp.poscollection.otherinout.detail` | export |
| `hxl.erp.posorder` | page, print, upload |
| `hxl.erp.posreport.areastorebusinessreport` | export, find |
| `hxl.erp.posreport.storebusinessreport` | export, find |
| `hxl.erp.preparepredictioncoefficient` | batchupdate, read, update |
| `hxl.erp.preparetype` | find, save, update |
| `hxl.erp.priceorder` | approve, batchdelete, export, page, read, refuse, save, update |
| `hxl.center.problemcategory` | find |
| `hxl.erp.purchase.order` | analysis |
| `hxl.erp.purchase.order.analysis` | export, log, read |
| `hxl.erp.purchasegroup` | delete, find, save, update |
| `hxl.erp.purchaseplan` | export, page, read, save, update |
| `hxl.erp.purchaseplandetail` | export, import, page, save |
| `hxl.erp.purchaseplandetail.template` | download |
| `hxl.erp.purchasereplenishanalysis` | export |
| `hxl.erp.purchasereplenishanalysis.item` | add |
| `hxl.erp.purchasereplenishanalysis.purchaseorder` | batchcreate, create |
| `hxl.erp.purchasereport.latestprice` | export |
| `hxl.erp.purchasereport.purchasemonitor.expireorder` | export, page |
| `hxl.erp.purchasereport.purchasemonitor.orderarrivalrate` | export, page |
| `hxl.erp.purchasereport.purchasemonitor.orderdetail` | export, page |
| `hxl.erp.purchasereport.purchasemonitor.orderstate` | export, page |
| `hxl.erp.purchasereport.purchasesummary.item` | find |
| `hxl.erp.purchasereport.purchasesummary.receiveorderdetail` | export, page |
| `hxl.erp.purchasereport.purchasesummary.returnorderdetail` | export, page |
| `hxl.erp.purchasereport.purchasesummary.storecategory` | export |
| `hxl.erp.purchasereport.purchasesummary.storeitem` | export |
| `hxl.erp.purchasereport.purchasesummary.supplier` | export |
| `hxl.erp.purchasereport.purchasesummary.supplieritem` | export |
| `hxl.erp.purchasereport.purchasesummary.supplierstore` | export |
| `hxl.erp.purchasereport.purchasesummary.supplierstoreitem` | export |
| `hxl.erp.purchasereport.storeoutstockwarning` | export, find |
| `hxl.erp.purchasereport.unsalableanalysis` | export |
| `hxl.erp.purchasereport.volumepriceanalysis` | find |
| `hxl.erp.reason` | find |
| `hxl.erp.replenishtemplate` | delete, find, read, save, update |
| `hxl.erp.replenishtemplate.item` | export, page |
| `hxl.erp.replenishtemplate.template` | download |
| `hxl.erp.replenishtemplatelog` | page |
| `hxl.erp.requestorder` | audit, autoadjust, batchaudit, batchdelete, batchinvalid, batchsave, check, copy, lock, merge, print, replenish, save, submit, unlock, update |
| `hxl.erp.requestorder.batchcreate.item` | page |
| `hxl.erp.requestorder.forcedelivery.item` | check |
| `hxl.erp.requestorder.item` | page |
| `hxl.erp.requestorder.itemcategory` | find |
| `hxl.erp.requestorder.outorder` | batchcreate |
| `hxl.erp.requestorder.template` | download |
| `hxl.erp.retailpricetemplate` | delete, page, read, save, update |
| `hxl.erp.retailpricetemplate.detail` | export, page |
| `hxl.erp.retailpricetemplate.detail.template` | download |
| `hxl.erp.retailpricetemplate.item` | batchupdate, find |
| `hxl.erp.retailpricetemplate.retailprice` | batchupdate, update |
| `hxl.erp.returnorder` | read |
| `hxl.erp.settlementparam` | read |
| `hxl.erp.sign` | certification |
| `hxl.erp.stockadjustmentreason` | batchupdate, delete, find, save, update |
| `hxl.erp.stockcheckorder` | export |
| `hxl.erp.stockcheckorder.detail` | export |
| `hxl.erp.stockplan` | export, page, save |
| `hxl.erp.stockplandetail` | export, page |
| `hxl.erp.stocktransformorder` | export |
| `hxl.erp.stocktransformorder.detail` | export |
| `hxl.erp.store.area` | find |
| `hxl.erp.store.area.find` | all |
| `hxl.erp.store.short` | page |
| `hxl.erp.storeapplicationorder.file` | upload |
| `hxl.erp.storeappropriationapplication` | audit, delete, export, page, pass, read, reaudit, reject, save, update |
| `hxl.erp.storeappropriationapplication.file` | upload |
| `hxl.erp.storedeliveryday` | delete, find, read, save, update |
| `hxl.erp.storedeliveryday.store` | export, import |
| `hxl.erp.storeitemattr.approvalorder` | delete, page, percent |
| `hxl.erp.storesupplierconfig` | find |
| `hxl.erp.supplier.businesslicense.file` | upload |
| `hxl.erp.supplier.short` | read |
| `hxl.erp.supplierfeeshareorder` | audit, batchdelete, delete, page, read, reaudit, save, suppliersummary, update |
| `hxl.erp.supplierfeeshareorder.detail` | find, page |
| `hxl.erp.user.querystore` | check |
| `hxl.erp.usercolumn` | get, update |
| `hxl.erp.wholesaleorder` | copy, reverse |
| `hxl.erp.wholesalereturnapply` | batchaudit, copy, invalid |
| `hxl.erp.wholesalereturnapply.detail` | export |
| `hxl.erp.wholesalereturnorder` | copy, createbyreturnorder, createbywholesaleorder, findsupplier, reverse |

## `/erp-mall`（商城, 8 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.erp.preparetype` | find |
| `hxl.erp.requestorder` | export, page, read |
| `hxl.erp.requestorder.detail` | batchexport, export |
| `hxl.erp.store.balance` | read |
| `hxl.erp.store.short` | page |

## `/erp-mdm`（主数据, 371 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.erp.account` | captchaverify |
| `hxl.erp.account.codelogin.user` | find |
| `hxl.erp.account.pwd.user` | find |
| `hxl.erp.account.user` | find |
| `hxl.erp.authority` | search |
| `hxl.erp.baseparam` | read |
| `hxl.erp.brand` | find |
| `hxl.erp.business.items` | batchimport |
| `hxl.erp.business.scope.backup` | batchexport, page, read |
| `hxl.erp.business.scope.backup.back` | confirm |
| `hxl.erp.business.scope.backup.pre` | read |
| `hxl.erp.businessarea` | delete, export, find, read, save, update, updatename |
| `hxl.erp.businessarea.detail` | find |
| `hxl.erp.businessarea.store` | find |
| `hxl.erp.businessarea.store.detail` | find |
| `hxl.erp.businessscope` | batchexport, batchupdate, batchupdatev2, delete, find, read, save, update |
| `hxl.erp.businessscope.heart` | beat, check, delete |
| `hxl.erp.businessscope.item` | delete, download, export, import, page, save |
| `hxl.erp.businessscope.short` | find |
| `hxl.erp.businessscope.store` | download, find |
| `hxl.erp.businessscope.store.item` | batchexport, page |
| `hxl.erp.businessscopecategory` | delete, find, save, update |
| `hxl.erp.cargo.owner` | pageforinner |
| `hxl.erp.category` | delete, find, import, save, update |
| `hxl.erp.categorytemplate` | download |
| `hxl.erp.client` | batchupdate, delete, export, import, page, read, save, storerelationship, update |
| `hxl.erp.client.balance` | read |
| `hxl.erp.client.batchupdate` | count |
| `hxl.erp.client.bms` | merchantstatus |
| `hxl.erp.client.code` | get |
| `hxl.erp.client.update` | import |
| `hxl.erp.clientcategory` | delete, find, save, update |
| `hxl.erp.clienthistory` | page, read |
| `hxl.erp.clientname` | import |
| `hxl.erp.clientnametemplate` | download |
| `hxl.erp.clienttemplate` | download |
| `hxl.erp.clientupdatetemplate` | download |
| `hxl.erp.companyinvoice` | page |
| `hxl.erp.companyinvoice.account` | find |
| `hxl.erp.curruser.wechat` | bind |
| `hxl.erp.customattribute` | find |
| `hxl.erp.customattribute.show` | find |
| `hxl.erp.delivery.cargo.owner.conf` | wholesale |
| `hxl.erp.dept` | find |
| `hxl.erp.feeitem` | find |
| `hxl.erp.file` | delete, ocr, upload |
| `hxl.erp.hardwarecategory` | find |
| `hxl.erp.investmentorder` | audit, batchdelete, download, import, invalid, page, read, save, update |
| `hxl.erp.investmentsubject` | delete, find, save, update |
| `hxl.erp.investmentsubjectcategory` | delete, find, save, update |
| `hxl.erp.ip.config` | page |
| `hxl.erp.item` | distribute, eliminate, export, findbybarcode, page, read, save, update |
| `hxl.erp.item.batch` | distribute, update |
| `hxl.erp.item.batch.update` | count, valid |
| `hxl.erp.item.code` | get |
| `hxl.erp.item.external.report` | find |
| `hxl.erp.item.image` | read |
| `hxl.erp.item.new` | update |
| `hxl.erp.item.short` | page |
| `hxl.erp.item.short.ids` | find |
| `hxl.erp.item.shorttemplate` | download |
| `hxl.erp.item.supplier` | page, read |
| `hxl.erp.item.supplier.priceadjustorder` | page |
| `hxl.erp.itemhistory` | page, read |
| `hxl.erp.itemlabel` | find |
| `hxl.erp.itemlabel.filter.role` | find |
| `hxl.erp.itemlabel.org` | all |
| `hxl.erp.itemmanagement` | find |
| `hxl.erp.itemproductspec` | find |
| `hxl.erp.itemrecycle` | batcheliminate |
| `hxl.erp.items` | batchimport |
| `hxl.erp.itemtemplate` | save |
| `hxl.erp.itemunit` | find |
| `hxl.erp.labour` | batchupdate, delete, export, import, page, read, save, update |
| `hxl.erp.labourcategory` | delete, find, save, update |
| `hxl.erp.labourhistory` | page, read |
| `hxl.erp.labourname` | import |
| `hxl.erp.labourtemplate` | download |
| `hxl.account.login.num` | check |
| `hxl.erp.mdm.item` | supplier |
| `hxl.erp.noticereceiveconfig` | find, update |
| `hxl.erp.noticetemplate` | audit, copy, delete, read, save, update |
| `hxl.erp.noticetype` | delete, find, save, update |
| `hxl.erp.order.item.on.way` | export, find |
| `hxl.erp.order.item.purchase.on.way` | export |
| `hxl.erp.org` | find, tree |
| `hxl.erp.org.all` | find |
| `hxl.erp.org.combinationitem` | export |
| `hxl.erp.org.distinct.item` | page |
| `hxl.erp.org.item` | batchimport, export, page, read, update |
| `hxl.erp.org.item.batch` | update |
| `hxl.erp.org.item.batch.update` | count, ids, valid |
| `hxl.erp.org.item.image` | export |
| `hxl.erp.org.item.update` | import |
| `hxl.erp.org.itembarcode` | export |
| `hxl.erp.org.itemsupdatetemplate` | download |
| `hxl.erp.org.logistics.org` | find |
| `hxl.erp.org.mainspecitem` | export |
| `hxl.erp.org.short.item` | page |
| `hxl.erp.outeruser` | import |
| `hxl.erp.outeruser.update` | import |
| `hxl.mdm.param.wholesaleprice` | read |
| `hxl.erp.parentassociationchild` | export |
| `hxl.erp.pc.menus` | find |
| `hxl.erp.printtemplate` | menus |
| `hxl.erp.purchasegroup` | find |
| `hxl.erp.role` | page, read |
| `hxl.erp.rolecategory` | find |
| `hxl.erp.service.account` | grant, page, terminate |
| `hxl.erp.service.account.self` | terminate |
| `hxl.erp.settlementcategory.center` | find |
| `hxl.erp.store` | page |
| `hxl.erp.store.all` | shortfind |
| `hxl.erp.store.all.deliverycenterstore` | find |
| `hxl.erp.store.area` | find |
| `hxl.erp.store.area.find` | all |
| `hxl.erp.store.center` | find |
| `hxl.erp.store.file` | pass, refuse |
| `hxl.erp.store.food.waithandle` | find |
| `hxl.erp.store.ids` | find |
| `hxl.erp.store.license.waithandle` | find |
| `hxl.erp.store.new` | page |
| `hxl.erp.store.sharedeliverycenter` | find |
| `hxl.erp.store.short` | batchimport, page, read |
| `hxl.erp.store.short.code` | find |
| `hxl.erp.storearea` | find |
| `hxl.erp.storeareacategory` | find |
| `hxl.erp.storecodetemplate` | download |
| `hxl.erp.storefileapply` | pass, read, refuse |
| `hxl.erp.storefileapply.waithandle` | find |
| `hxl.erp.storegroup` | delete, find, save, update |
| `hxl.erp.storehardware.category` | find |
| `hxl.erp.storehouse` | page |
| `hxl.erp.storehouse.contact` | find |
| `hxl.erp.storehouse.store` | find |
| `hxl.erp.storelabel` | find |
| `hxl.erp.storenotice` | audit, batchdelete, batchinvalid, copy, invalid, page, read, save, update |
| `hxl.erp.storenoticeapplystore` | find |
| `hxl.erp.supplier` | delete, export, getsharestore, import, page, read, save, update |
| `hxl.erp.supplier.account` | find |
| `hxl.erp.supplier.auth` | check |
| `hxl.erp.supplier.balance` | read |
| `hxl.erp.supplier.batch` | update |
| `hxl.erp.supplier.batch.update` | cnt |
| `hxl.erp.supplier.children` | find |
| `hxl.erp.supplier.code` | get |
| `hxl.erp.supplier.contract` | bind, unbind |
| `hxl.erp.supplier.label` | export, save |
| `hxl.erp.supplier.organization.apply` | query |
| `hxl.erp.supplier.organization.approve` | create |
| `hxl.erp.supplier.organization.approve.oa` | cancel, query |
| `hxl.erp.supplier.organization.file` | upload |
| `hxl.erp.supplier.organization.order` | page, query |
| `hxl.erp.supplier.producer` | find |
| `hxl.erp.supplier.producerandexecutivestandard` | find |
| `hxl.erp.supplier.read` | supplier |
| `hxl.erp.supplier.sharestore` | import |
| `hxl.erp.supplier.sharestoretemplate` | download |
| `hxl.erp.supplier.short` | page |
| `hxl.erp.supplierassociationsupplier` | export |
| `hxl.erp.suppliercategory` | delete, find, findwithsupplier, save, update |
| `hxl.erp.suppliercontract` | audit, batchdelete, invalid, page, read, reaudit, save, update |
| `hxl.erp.suppliercontract.file` | upload |
| `hxl.erp.suppliercontract.item` | export |
| `hxl.erp.suppliercontract.unloadingfee` | update |
| `hxl.erp.supplierhistory` | page, read |
| `hxl.erp.supplierhistory.field` | export, page |
| `hxl.erp.suppliermainbody` | find |
| `hxl.erp.suppliername` | import |
| `hxl.erp.suppliernametemplate` | download |
| `hxl.erp.supplierqualityorder` | export, page, read |
| `hxl.erp.supplierqualityorder.comment` | save |
| `hxl.erp.supplierqualityorder.param` | find |
| `hxl.erp.suppliertemplate` | download |
| `hxl.erp.supplieruser` | copy |
| `hxl.erp.user` | batchupdate, find, import, login, logout, page, read, save, update |
| `hxl.erp.user.account` | login |
| `hxl.erp.user.app.qrcode` | create, query |
| `hxl.erp.user.bind` | customerservice |
| `hxl.erp.user.changepwdtelcode` | send |
| `hxl.erp.user.changetelcode` | send |
| `hxl.erp.user.changetelcodechenk` | confirm, send |
| `hxl.erp.user.checkcode` | send |
| `hxl.erp.user.client` | import, save, update |
| `hxl.erp.user.client.update` | import |
| `hxl.erp.user.logincode` | send |
| `hxl.erp.user.pos` | page |
| `hxl.erp.user.pos.update` | import |
| `hxl.erp.user.pwd` | reset |
| `hxl.erp.user.resetcode` | send |
| `hxl.erp.user.resetpwd` | confirm, find |
| `hxl.erp.user.resetpwdcode` | send |
| `hxl.erp.user.resetpwdvoicecode` | send |
| `hxl.erp.user.self` | update |
| `hxl.erp.user.source` | save, update |
| `hxl.erp.user.store` | switch |
| `hxl.erp.user.supplier` | batchupdate, import, save, update |
| `hxl.erp.user.supplier.update` | import |
| `hxl.erp.user.tel` | change, confirm |
| `hxl.erp.user.update` | import |
| `hxl.erp.user.voicecode` | send |
| `hxl.erp.user.wechat` | bind, login, unbind |
| `hxl.erp.user.wechat.qrcode` | get |
| `hxl.erp.usercolumn` | get, update |
| `hxl.erp.userdept` | find |
| `hxl.erp.usernotice` | page, read |

## `/erp-purchase`（采购, 126 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.scm.purchasedata.track` | export, find |
| `hxl.erp.purchaseorder` | audit, batchaudit, batchdelete, copy, export, import, invalid, onway, page, print, read, receivesummary, reportsummary, save, update |
| `hxl.erp.purchaseorder.detail` | export |
| `hxl.erp.purchaseorder.file` | upload |
| `hxl.erp.purchaseorder.item` | page |
| `hxl.erp.purchaseorder.minimumdeliveryquantity` | batchcheck, check |
| `hxl.erp.purchaseorder.order` | import |
| `hxl.erp.purchaseorder.order.import` | save |
| `hxl.erp.purchaseorder.ordertemplate` | download |
| `hxl.erp.purchaseorder.print` | read, readdetail |
| `hxl.erp.purchaseorder.relationorder` | find |
| `hxl.erp.purchaseorder.splitorder` | check |
| `hxl.erp.purchaseorder.template` | download |
| `hxl.erp.purchaseparam` | read, save |
| `hxl.erp.purchaseplan` | report |
| `hxl.erp.purchaseplan.report` | export |
| `hxl.erp.purchasereplenishanalysis` | find, read |
| `hxl.erp.purchasereplenishanalysis.item` | page |
| `hxl.erp.purchasereplenishanalysis.itemstore` | export, find |
| `hxl.erp.purchasereport.latestprice` | page |
| `hxl.erp.purchasereport.purchasesummary.storecategory` | page |
| `hxl.erp.purchasereport.purchasesummary.storeitem` | page |
| `hxl.erp.purchasereport.purchasesummary.supplier` | page |
| `hxl.erp.purchasereport.purchasesummary.supplieritem` | page |
| `hxl.erp.purchasereport.purchasesummary.supplierstore` | page |
| `hxl.erp.purchasereport.purchasesummary.supplierstoreitem` | page |
| `hxl.erp.receiveorde.short` | page |
| `hxl.erp.receiveorder` | audit, batchaudit, batchcopy, batchdelete, batchreverse, copy, createbypurchaseorder, export, findbypurchaseorder, import, page, print, read, reportreconciled, reportsummary, reverse, reverseandcopy, save, update |
| `hxl.erp.receiveorder.detail` | export |
| `hxl.erp.receiveorder.file` | upload |
| `hxl.erp.receiveorder.find` | olderp |
| `hxl.erp.receiveorder.item` | page |
| `hxl.erp.receiveorder.itemsummary` | find |
| `hxl.erp.receiveorder.print` | read, readdetail |
| `hxl.erp.receiveorder.template` | download |
| `hxl.erp.receiveorder.tmp` | reaudit |
| `hxl.erp.receiveorder.wholesale` | transform |
| `hxl.erp.returnapplicationorder` | audit, delete, export, findbyupdatetime, invalid, page, read, save, update |
| `hxl.erp.returnapplicationorder.outapplicationorder` | invalid |
| `hxl.erp.returnorder` | audit, batchaudit, batchcopy, batchdelete, batchread, batchreverse, copy, createbyreceiveorder, export, findbyreceiveorder, import, page, print, read, reverse, reverseaudit, save, submit, update |
| `hxl.erp.returnorder.batchupdate` | settlementstoreids |
| `hxl.erp.returnorder.detail` | export |
| `hxl.erp.returnorder.file` | upload |
| `hxl.erp.returnorder.item` | page |
| `hxl.erp.returnorder.print` | read, readdetail |
| `hxl.erp.returnorder.template` | download |
| `hxl.erp.storeitemsupplier` | batchdelete, batchupdate, batchupdateattr, batchupdateprice, export, import, page, update |
| `hxl.erp.storeitemsupplier.import` | cancel |
| `hxl.erp.storeitemsupplier.importprogress` | check |
| `hxl.erp.storeitemsupplier.main` | batchupdate |
| `hxl.erp.storeitemsupplier.originplace` | find |
| `hxl.erp.storeitemsupplier.producer` | read |
| `hxl.erp.storeitemsupplier.purchaseperiod` | import |

## `/erp-stock`（库存, 47 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.erp.itemstocklog` | page |
| `hxl.erp.stockadjustmentreason` | find |
| `hxl.erp.stockadjustorder` | audit, batchdelete, copy, page, read, reverse, save, update |
| `hxl.erp.stockadjustorder.item` | page |
| `hxl.erp.stockcheckorder` | audit, batchdelete, checkinitorder, copy, finish, invalid, lock, merge, page, read, reaudit, reverse, save, unlock, update |
| `hxl.erp.stockcheckorder.file` | upload |
| `hxl.erp.stockcheckorder.item` | page |
| `hxl.erp.stockcheckorder.snapshote` | update |
| `hxl.erp.stockcheckorder.template` | download |
| `hxl.erp.stockcheckorder.updatetemplate` | download |
| `hxl.erp.stockcostadjustorder` | audit, batchdelete, page, read, save, update |
| `hxl.erp.stockcostadjustorder.item` | page |
| `hxl.erp.stockdetail` | page |
| `hxl.erp.stocktransformorder` | audit, batchdelete, copy, page, read, save, update |
| `hxl.erp.stocktransformorder.item` | page |

## `/erp-wholesale`（批发, 61 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.erp.wholesalebookorder` | audit, batchdelete, batchinvalid, check, copy, invalid, merge, page, print, read, save, update |
| `hxl.erp.wholesalebookorder.item` | page |
| `hxl.erp.wholesalebookorder.wholesaleorder` | batchcreate |
| `hxl.erp.wholesalecenterstore` | find |
| `hxl.erp.wholesaleorder` | audit, batchcopy, batchdelete, batchreverse, page, print, read, receive, save, update, wholesaleprice |
| `hxl.erp.wholesaleorder.detail` | export |
| `hxl.erp.wholesaleorder.file` | upload |
| `hxl.erp.wholesaleorder.item` | page |
| `hxl.erp.wholesaleorder.template` | download |
| `hxl.erp.wholesaleparam` | read |
| `hxl.erp.wholesalereturnapply` | approve, approverefuse, approveupdate, audit, batchdelete, export, handle, handlerefuse, page, print, read, reaudit, save, update |
| `hxl.erp.wholesalereturnapply.file` | upload |
| `hxl.erp.wholesalereturnapply.item` | page |
| `hxl.erp.wholesalereturnapply.template` | download |
| `hxl.erp.wholesalereturnorder` | audit, batchcopy, batchdelete, batchreverse, page, print, read, save, update |
| `hxl.erp.wholesalereturnorder.detail` | export |
| `hxl.erp.wholesalereturnorder.file` | upload |
| `hxl.erp.wholesalereturnorder.item` | page |
| `hxl.erp.wholesalereturnorder.template` | download |

## `/export`（导出, 1 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.export.reporthistory` | find |

## `/fsms`（结算, 1 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.center.problemcategory` | find |

## `/fss`（财务, 134 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.fss.clientadvancecollect` | audit, batchdelete, clientsummary, export, page, read, refund, save, update |
| `hxl.fss.clientadvancecollect.clientsummary` | export |
| `hxl.fss.clientfee` | audit, batchdelete, page, read, reaudit, save, update |
| `hxl.fss.clientfee.file` | upload |
| `hxl.fss.clientsettlementorder` | audit, batchdelete, clientsummary, page, read, reaudit, save, update |
| `hxl.fss.clientsettlementorder.detail` | page |
| `hxl.fss.clientsettlementorder.file` | upload |
| `hxl.fss.invoiceorder` | audit, batchaudit, batchdelete, confirm, confirmbatch, page, read, reaudit, save, update |
| `hxl.fss.invoiceorder.detail` | page |
| `hxl.fss.labourfee` | audit, batchdelete, page, read, reaudit, save, share, update |
| `hxl.fss.labourfee.file` | upload |
| `hxl.fss.labourfee.invoice` | delete |
| `hxl.fss.labourfee.supplierfee` | save |
| `hxl.fss.store.short.settlement` | page |
| `hxl.fss.storeaccount` | close, open, page |
| `hxl.fss.storeaccount.detail` | export, find |
| `hxl.fss.storeaccount.summary` | find |
| `hxl.fss.storeadvancecollect` | audit, batchaudit, batchdelete, delete, export, page, read, reaudit, refund, save, storesummary, update |
| `hxl.fss.storeadvancecollect.storesummary` | export |
| `hxl.fss.storefee` | approve, audit, batchdelete, batchreaudit, batchreject, export, invalid, page, read, reaudit, refuse, reject, reverse, save, update |
| `hxl.fss.storefee.file` | upload |
| `hxl.fss.storefee.nonoperating` | import |
| `hxl.fss.storefee.nonoperating.template` | download |
| `hxl.fss.storefee.normal` | batchapprove, batchaudit |
| `hxl.fss.storereport.cashmanage.detail` | export, page |
| `hxl.fss.storereport.cashmanage.summary` | export, page |
| `hxl.fss.supplieradvancepay` | audit, batchaudit, batchdelete, checkpay, createpay, delete, export, page, paysummary, print, read, readlastbalance, reaudit, refund, save, suppliersummary, update |
| `hxl.fss.supplieradvancepay.file` | upload |
| `hxl.fss.supplieradvancepay.purchaseorder` | find |
| `hxl.fss.supplieradvancepay.suppliersummary` | export |
| `hxl.fss.supplierfee` | approve, audit, batchapprove, batchaudit, batchdelete, copy, invalid, invoice, page, print, read, reaudit, refuse, reverse, reverseandcopy, save, update |
| `hxl.fss.supplierfee.finance` | page |
| `hxl.fss.supplierfee.invoice` | delete |
| `hxl.fss.supplierfee.unconfirm.scm` | count |

## `/hrs`（人力, 2 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.hrs.organization.child.feign` | find |
| `hxl.hrs.user.roster.feign` | find |

## `/kms`（招商, 56 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.kms.(root)` |  |
| `hxl.kms.area` | find |
| `hxl.kms.area.open` | search |
| `hxl.kms.brand` | find |
| `hxl.kms.buildtask` | page, read |
| `hxl.kms.businessarea` | , find |
| `hxl.kms.businessplan` | page, read |
| `hxl.kms.client.choose` | find |
| `hxl.kms.client.contracttemplate` | find |
| `hxl.kms.clientclew` | read |
| `hxl.kms.clientcluepool` | save |
| `hxl.kms.clientcluetemplate` | delete, find, findbystep, read, save, update |
| `hxl.kms.clientcluetemplate.fix` | find |
| `hxl.kms.clientcluetemplate.sequence` | update |
| `hxl.kms.clientfollowuser.authority` | find |
| `hxl.kms.clientfollowuser.user` | page |
| `hxl.kms.clientorcluefollowuser.authority` | find |
| `hxl.kms.clink.call` | login |
| `hxl.kms.company` | find |
| `hxl.kms.contracttemplate` | find |
| `hxl.kms.dictionary` | page |
| `hxl.kms.fadada.user` | find |
| `hxl.kms.file` | upload |
| `hxl.kms.intentmoney.client` | page |
| `hxl.kms.intentmoney.offset` | find |
| `hxl.kms.interestuser` | delete, find, save |
| `hxl.kms.interestuser.flag` | find |
| `hxl.kms.investment.session` | read |
| `hxl.kms.itemchange` | find |
| `hxl.kms.material` | page |
| `hxl.kms.material.type` | find |
| `hxl.kms.noticerecord` | find, update |
| `hxl.kms.noticerecord.notread` | find |
| `hxl.kms.organization.currentuser` | find |
| `hxl.kms.projectcostitem` | find |
| `hxl.kms.schedue.shift` | find |
| `hxl.kms.store` | page |
| `hxl.kms.storeapply` | page |
| `hxl.kms.storeapply.file` | upload |
| `hxl.kms.storelookmission.intentmoney` | page |
| `hxl.kms.storeplan` | page, read |
| `hxl.kms.user` | page |
| `hxl.kms.versionlog` | find |
| `hxl.kms.versionlog.notice` | read |

## `/member`（会员, 10 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.member.cardtype` | find |
| `hxl.member.coupontype` | page |
| `hxl.member.param.paymenttype` | find |
| `hxl.member.tiktok.store` | delete, export, import, page, save, update |
| `hxl.member.tiktok.store.template` | download |

## `/oa`（审批, 15 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.oa.approval.commonphrase` | find |
| `hxl.oa.approval.commonphrase.batch` | save |
| `hxl.oa.approval.find` | all |
| `hxl.oa.approvaltask` | cancel, complete, reject, send, sign, transfer, urge |
| `hxl.oa.approvaltaskhistory` | check |
| `hxl.oa.approvataskhistory` | find |
| `hxl.oa.file` | upload |
| `hxl.oa.organization.child` | find |
| `hxl.oa.user` | page |

## `/retail`（零售, 6 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.retail.posorder` | readbyserialnumber |
| `hxl.retail.promotionspecialprice.item` | page |
| `hxl.retail.promotionspecialprice.item.all` | choose |
| `hxl.retail.retailpricetemplate` | page |
| `hxl.retail.retailpricetemplate.all` | choose |
| `hxl.retail.store.ids` | page |

## `/scm`（供应链协同, 83 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.scm.(root)` |  |
| `hxl.scm.erp.role` | page |
| `hxl.scm.homepage.card` | find |
| `hxl.scm.homepage.newstore` | summary |
| `hxl.scm.homepage.order` | find |
| `hxl.scm.homepage.purchase` | rate |
| `hxl.scm.homepage.receive` | summary |
| `hxl.scm.homepage.waithandle` | find |
| `hxl.scm.itemapplyorder` | approve, audit, copy, delete, deny, export, page, pass, read, reaudit, refuse, save, update |
| `hxl.scm.itemapplyorder.batch` | pass |
| `hxl.scm.itemapplyorder.file` | upload |
| `hxl.scm.itemapplyorder.file.convert` | upload |
| `hxl.scm.itemapplyorder.update` | item |
| `hxl.scm.itemapplyorder.userpurchasemanager` | find |
| `hxl.scm.itemapplyorderreport.passrate` | export, find |
| `hxl.scm.itemapplyorderreport.shelfrate` | export, find |
| `hxl.scm.itemapplyorderreport.successrate` | export, find |
| `hxl.scm.itemdeliveryorder` | audit, delete, page, read, reaudit, receive, save, update |
| `hxl.scm.itempubliccategory` | list |
| `hxl.scm.labourfee.order` | page |
| `hxl.scm.scmparam` | read |
| `hxl.scm.sendorder` | doorder, save, savecheck |
| `hxl.scm.shippingorder` |  |
| `hxl.scm.shippingorder.detail.check` | receiverule |
| `hxl.scm.shippingorder.file` | upload |
| `hxl.scm.shippingorder.ontime` | stats |
| `hxl.scm.supplier.spotcheck` | delete, page, read, save, update |
| `hxl.scm.supplier.spotcheck.sequence` | update |
| `hxl.scm.supplier.spotcheckorder` | delete, save, update |
| `hxl.scm.suppliercontract` | audit, save, update |
| `hxl.scm.suppliercontractorderpresent` | find |
| `hxl.scm.supplierfeedback` | close, finish, page, read, save, update |
| `hxl.scm.supplierfeedback.file` | upload |
| `hxl.scm.suppliernotice` | audit, batchdelete, batchinvalid, copy, page, read, save, update, upload |
| `hxl.scm.suppliernotice.read` | page |
| `hxl.scm.supplierunload` | compensate |
| `hxl.scm.usernotice` | page, read |

## `/scm-mdm`（供应商主数据, 59 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.scm.centeruser` | page |
| `hxl.scm.file.sts.token` | query |
| `hxl.scm.itempubliccategory` | list |
| `hxl.scm.supplier.framework.file` | upload |
| `hxl.scm.supplieraccessorder` | approve, audit, auditdeny, deny, export, page, pass, read, refuse |
| `hxl.scm.supplieraccessorder.approval` | record |
| `hxl.scm.supplieraccessorder.approval.record` | export |
| `hxl.scm.supplieraccessorder.approve` | reject |
| `hxl.scm.supplieraccessorder.archive` | approve |
| `hxl.scm.supplieraccessorder.categorymanager` | page |
| `hxl.scm.supplieraccessorder.company` | query |
| `hxl.scm.supplieraccessorder.handle` | reject |
| `hxl.scm.supplieraccessorder.itemcategory` | query |
| `hxl.scm.supplieraccessorder.review` | pass, refuse |
| `hxl.scm.suppliercontractorder.export` | item |
| `hxl.scm.suppliercontractorder.file.convert` | upload |
| `hxl.scm.suppliercontractorder.importitem` | find |
| `hxl.scm.suppliercontractorder.rebate` | audit, check, compensate, copy, export, invalid, page, read, reaudit, save, update |
| `hxl.scm.suppliercontractorder.rebate.approve` | detail, query |
| `hxl.scm.suppliercontractorder.rebate.change` | check |
| `hxl.scm.suppliercontractorder.rebate.feeitem` | update |
| `hxl.scm.suppliercontractorder.rebate.fss` | rebate |
| `hxl.scm.suppliercontractorder.rebate.org` | check |
| `hxl.scm.suppliercontractorder.rebate.relate` | file |
| `hxl.scm.suppliercontractorder.rebate.rule` | update |
| `hxl.scm.suppliercontractorder.unloading` | batchaudit, copy, download, export, import, invalid, read, reaudit, save, suspension, update |
| `hxl.scm.suppliercontractorder.unloading.feeitem` | update |
| `hxl.scm.suppliercontractorderpresent` | suspension |
| `hxl.scm.supplierrebate.importitem` | download |

## `/sms`（短信, 1 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.sms.tc.task.pending` | count |

## `/tms`（运输, 8 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.tms.car` | page |
| `hxl.tms.carrier` | page |
| `hxl.tms.driver` | page |
| `hxl.tms.route` | page |
| `hxl.tms.sign` | certification |
| `hxl.tms.sign.certification` | check |
| `hxl.tms.store` | find |
| `hxl.tms.storehouse` | find |

## `/user-portal`（用户门户, 2 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.uc.pos.config` | find, save |

## `/wms`（仓储, 105 端点）

| 实体（RPC 前缀 hxl.xxx.） | 动作 |
|---|---|
| `hxl.wms.(root)` |  |
| `hxl.wms.car` | page |
| `hxl.wms.carcategory` | delete, find, save, update |
| `hxl.wms.channel` | find |
| `hxl.wms.client` | find, page |
| `hxl.wms.clientlabel` | find |
| `hxl.wms.file` | delete |
| `hxl.wms.inapplicationorder` | page, read |
| `hxl.wms.inapplicationorder.scm` | find |
| `hxl.wms.inorder` | audit, batchdelete, check, export, page, read, save, update, upload |
| `hxl.wms.inorder.detail` | export |
| `hxl.wms.item` | find, page |
| `hxl.wms.itemstocklog` | page, summary |
| `hxl.wms.itemstocklog.change` | find |
| `hxl.wms.movestock` | audit, batchdelete, check, copy, page, read, save, update |
| `hxl.wms.movestock.stockdetail` | page |
| `hxl.wms.outapplicationorder.pickorder.diff` | create |
| `hxl.wms.outorder` | audit, batchdelete, export, page, print, read, save, update, upload |
| `hxl.wms.outorderdetail` | export |
| `hxl.wms.pickorder` | abord, addpriority, assign, checkcancel, export, page, pickcancel, print, summary |
| `hxl.wms.pickorder.batchprint` | label |
| `hxl.wms.pickorder.client` | depart |
| `hxl.wms.pickorder.detail` | export, find |
| `hxl.wms.pickorder.distribute.label` | batchprint, repairprint, selfprint |
| `hxl.wms.pickorder.repairprint` | label |
| `hxl.wms.pickorder.summary` | export, read |
| `hxl.wms.pickorder.task` | send |
| `hxl.wms.returnstorage` | read |
| `hxl.wms.stockcheckorder` | audit, batchcopy, batchdelete, export, finish, invalid, page, print, read, replay, save, startapproval, update |
| `hxl.wms.stockcheckorder.detail` | export |
| `hxl.wms.stockcheckorder.item` | find |
| `hxl.wms.storage` | find, page |
| `hxl.wms.storagecategory` | find |
| `hxl.wms.storehouse` | find |
| `hxl.wms.supplier.spotcheckorder` | audit, delete, finish, page, read, reaudit, rejection, save, update |
| `hxl.wms.supplier.spotcheckorder.detail.statistics` | export |
| `hxl.wms.supplier.spotcheckorder.statistics` | export, find, read |
| `hxl.wms.supplier.spotcheckorder.statisticsitem` | read |
| `hxl.wms.wmsparam` | read |
| `hxl.wms.wmsparam.new` | read |