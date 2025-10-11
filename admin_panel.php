<?php
session_start();
include 'db.php';

// Check if admin is logged in
if(!isset($_SESSION['admin'])){
    header("Location: index.php");
    exit();
}

$classes = range(6,12);
$months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
$current_month_index = date('n')-1;
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Panel - The Academic Care</title>
<link rel="stylesheet" href="style.css">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<style>
.tabs-menu { display: flex; flex-wrap: wrap; margin-bottom:10px; }
.tabs-menu button { flex:1; padding:10px; cursor:pointer; background-color:#2980B9; color:white; border:none; margin:1px; }
.tabs-menu button:hover { background-color:#3498DB; }
.tab { display:none; }
.tab.active { display:block; }
.sub-tab-menu { display:flex; flex-wrap:wrap; margin-bottom:5px; }
.sub-tab-menu button { flex:1; padding:5px; background-color:#34495E; color:white; border:none; margin:1px; }
.sub-tab-menu button:hover { background-color:#2C3E50; }
table { width:100%; border-collapse: collapse; }
table, th, td { border:1px solid #ddd; }
th, td { padding:5px; text-align:center; }
</style>
<script>
function openTab(tabName){
    var tabs = document.getElementsByClassName('tab');
    for(var i=0;i<tabs.length;i++){ tabs[i].classList.remove('active'); }
    document.getElementById(tabName).classList.add('active');
}
function openSubTab(subTabId){
    var subtabs = document.getElementsByClassName('sub-tab');
    for(var i=0;i<subtabs.length;i++){ subtabs[i].style.display='none'; }
    document.getElementById(subTabId).style.display='block';
}

function adminAction(action, id, method=''){
    $.ajax({
        url: 'ajax_actions.php',
        method: 'POST',
        data: {action: action, fee_id: id, method: method, request_id: id, student_id: id},
        success: function(response){
            let res = JSON.parse(response);
            alert(res.msg);
            if(res.status=='success'){
                location.reload(); // refresh table after success
            }
        }
    });
}
</script>
</head>
<body>
<header>
    <h1>The Academic Care</h1>
    <h2>Academic Year 2025</h2>
</header>
<div class="container">

    <div class="tabs-menu">
        <button onclick="openTab('home')">Home</button>
        <button onclick="openTab('class')">Class</button>
        <button onclick="openTab('registration')">Registration</button>
        <button onclick="openTab('break_requests')">Break Requests</button>
        <form method="post" style="display:inline;">
            <button type="submit" name="logout">Sign Out</button>
        </form>
    </div>

    <!-- Home Tab -->
    <div id="home" class="tab active">
        <h3>Welcome Admin!</h3>
        <p>Select a tab above to manage classes, registrations, or break requests.</p>
    </div>

    <!-- Class Tab -->
    <div id="class" class="tab">
        <h3>Class Management</h3>
        <div class="sub-tab-menu">
            <?php foreach($classes as $c){ ?>
                <button onclick="openSubTab('class_<?php echo $c; ?>')">Class <?php echo $c; ?></button>
            <?php } ?>
        </div>

        <?php foreach($classes as $c){ ?>
        <div id="class_<?php echo $c; ?>" class="sub-tab" style="display:none;">
            <h4>Class <?php echo $c; ?></h4>
            <table>
                <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>WhatsApp</th>
                    <th>Tuition Fee Status</th>
                </tr>
                <?php
                $stmt = $conn->prepare("SELECT * FROM students WHERE class=? AND status='approved'");
                $stmt->bind_param("i",$c);
                $stmt->execute();
                $res = $stmt->get_result();
                while($student = $res->fetch_assoc()){
                    echo "<tr>";
                    echo "<td>".$student['name']."</td>";
                    echo "<td>".$student['student_id']."</td>";
                    echo "<td>".$student['whatsapp']."</td>";
                    echo "<td>";
                    echo "<table><tr><th>Month</th><th>Status</th><th>Date</th><th>Method</th><th>Action</th></tr>";
                    for($i=0;$i<=$current_month_index;$i++){
                        $month = $months[$i];
                        $stmt_fee = $conn->prepare("SELECT * FROM tuition_fee WHERE student_id=? AND month_name=?");
                        $stmt_fee->bind_param("ss",$student['student_id'],$month);
                        $stmt_fee->execute();
                        $res_fee = $stmt_fee->get_result();
                        if($res_fee->num_rows>0){
                            $fee = $res_fee->fetch_assoc();
                            $status = $fee['status'];
                            $date = $fee['payment_date'];
                            $method = $fee['payment_method'];
                            $fee_id = $fee['id'];
                        } else {
                            $status = "Unpaid"; $date = "-"; $method = "-";
                            $stmt_insert = $conn->prepare("INSERT INTO tuition_fee (student_id,month_name,status) VALUES (?,?, 'Unpaid')");
                            $stmt_insert->bind_param("ss",$student['student_id'],$month);
                            $stmt_insert->execute();
                            $fee_id = $conn->insert_id;
                        }
                        echo "<tr>";
                        echo "<td>$month</td>";
                        echo "<td>$status</td>";
                        echo "<td>$date</td>";
                        echo "<td>$method</td>";
                        echo "<td>";
                        if($status=="Unpaid"){
                            echo "<input type='text' placeholder='Method' id='method_$fee_id'>";
                            echo "<button onclick=\"adminAction('mark_paid',$fee_id,document.getElementById('method_$fee_id').value)\">Mark Paid</button>";
                            echo "<button onclick=\"adminAction('mark_break',$fee_id)\">Mark Break</button>";
                        } else {
                            echo "<button onclick=\"adminAction('undo',$fee_id)\">Undo</button>";
                        }
                        echo "</td></tr>";
                    }
                    echo "</table>";
                    echo "</td></tr>";
                }
                ?>
            </table>
        </div>
        <?php } ?>
    </div>

    <!-- Registration Tab -->
    <div id="registration" class="tab">
        <h3>Registration Requests</h3>
        <table>
            <tr><th>Student Name</th><th>Student ID</th><th>Class</th><th>Roll</th><th>WhatsApp</th><th>Action</th></tr>
            <?php
            $stmt = $conn->prepare("SELECT * FROM students WHERE status='pending'");
            $stmt->execute();
            $res = $stmt->get_result();
            while($stu = $res->fetch_assoc()){
                echo "<tr>";
                echo "<td>".$stu['name']."</td>";
                echo "<td>".$stu['student_id']."</td>";
                echo "<td>".$stu['class']."</td>";
                echo "<td>".$stu['roll']."</td>";
                echo "<td>".$stu['whatsapp']."</td>";
                echo "<td>
                    <button onclick=\"adminAction('approve_registration','".$stu['student_id']."')\">Approve</button>
                    <button onclick=\"adminAction('deny_registration','".$stu['student_id']."')\">Deny</button>
                </td>";
                echo "</tr>";
            }
            ?>
        </table>
    </div>

    <!-- Break Requests Tab -->
    <div id="break_requests" class="tab">
        <h3>Break Requests</h3>
        <table>
            <tr><th>Student ID</th><th>Month</th><th>Status</th><th>Action</th></tr>
            <?php
            $stmt = $conn->prepare("SELECT * FROM break_requests WHERE status='Pending'");
            $stmt->execute();
            $res = $stmt->get_result();
            while($br = $res->fetch_assoc()){
                echo "<tr>";
                echo "<td>".$br['student_id']."</td>";
                echo "<td>".$br['month_name']."</td>";
                echo "<td>".$br['status']."</td>";
                echo "<td>
                    <button onclick=\"adminAction('approve_break',".$br['id'].")\">Approve</button>
                    <button onclick=\"adminAction('deny_break',".$br['id'].")\">Deny</button>
                </td>";
                echo "</tr>";
            }
            ?>
        </table>
    </div>

</div>
<script>openTab('home');</script>
</body>
</html>
